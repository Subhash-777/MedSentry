/**
 * ai-router — MedSentry Phase 3 Edge Function
 *
 * Auth pattern (per plan.md §3.2 + user review):
 *   - ANON key client  → used ONLY to verify the caller's JWT via auth.getUser(jwt).
 *     SUPABASE_ANON_KEY is auto-injected into every Edge Function by Supabase; no secret setup needed.
 *   - SERVICE ROLE client → used ONLY for privileged DB writes (api_usage_logs has no RLS policy
 *     yet; service role ensures writes always land regardless of future policy changes).
 *     SUPABASE_SERVICE_ROLE_KEY is also auto-injected; no secret setup needed.
 *   - Mobile client attaches the user's session JWT automatically via supabase.functions.invoke().
 *   - All AI provider keys (GEMINI_API_KEY, GROQ_API_KEY, …) live as Supabase secrets; the
 *     mobile client never holds them.
 *
 * Consultant modes (plan.md §2.5):
 *   1. suitability       — medicine-suitability check against user's active courses + conditions
 *   2. symptom_to_care   — symptom analysis with AWaRe-aware necessity flag output
 *   3. visual_id         — visual medicine identification from image
 *
 * Guardrails (plan.md §2.5 / §3.3) — three distinct, independently tested checks:
 *   Guard 1: Pediatric dosage calculation refusal
 *   Guard 2: Overdose question refusal (standalone — not conflated with Guard 3)
 *   Guard 3: Severe self-diagnosis refusal (cancer, heart attack, stroke)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// Types
// ============================================================================

type ConsultantMode = "suitability" | "symptom_to_care" | "visual_id";
type RequestType = ConsultantMode | "chatbot";
type NecessityFlag = "necessary" | "not_necessary" | "unclear";

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface RouterPayload {
  request_type: RequestType;
  messages?: AIMessage[];
  image_base64?: string;
  userContext?: {
    userId?: string;
    query?: string;
    linked_course_id?: string;  // for necessity_flag write-back
    drug_name?: string;         // for AWaRe lookup context
  };
}

// ============================================================================
// Guard 1: Pediatric dosage refusal
// ============================================================================
function guardPediatricDosage(text: string): string | null {
  const lower = text.toLowerCase();
  const isPediatricContext =
    lower.includes("child") ||
    lower.includes("pediatric") ||
    lower.includes("infant") ||
    lower.includes("baby") ||
    lower.includes("toddler");
  const isDosageCalc = /\b(mg|ml|dose|dosage|calculate|how much|give)\b/.test(lower);
  if (isPediatricContext && isDosageCalc) {
    return "I cannot calculate pediatric dosages. Exact dosing for children must come from a licensed pediatrician or pharmacist — please consult one directly.";
  }
  return null;
}

// ============================================================================
// Guard 2: Overdose refusal (standalone — separate from Guard 3)
// ============================================================================
function guardOverdose(text: string): string | null {
  const lower = text.toLowerCase();
  const overdoseTerms = [
    "overdose",
    "how many pills to",
    "how much to kill",
    "lethal dose",
    "fatal amount",
    "what happens if i take too many",
  ];
  if (overdoseTerms.some((t) => lower.includes(t))) {
    return "I cannot answer questions about overdose amounts or lethal doses. If you or someone you know is in danger, call emergency services (112/911) or a poison control center immediately.";
  }
  return null;
}

// ============================================================================
// Guard 3: Severe self-diagnosis refusal (separate from Guard 2)
// ============================================================================
function guardSelfDiagnosis(text: string): string | null {
  const lower = text.toLowerCase();
  const severeTerms = ["cancer", "heart attack", "stroke", "myocardial infarction", "tumor"];
  if (severeTerms.some((t) => lower.includes(t))) {
    return "Your question describes a potentially serious medical condition. I am an AI assistant, not a doctor. Please see a qualified healthcare professional immediately — do not rely on AI for this.";
  }
  return null;
}

// ============================================================================
// Apply all three guardrails in order
// Returns { safeText, flagged, guardTriggered }
// ============================================================================
function applyGuardrails(
  userInput: string,
  aiResponse: string
): { safeText: string; flagged: boolean; guardTriggered: string | null } {
  // Apply guards against the user's original input (catches intent before the AI response)
  const combinedCheck = userInput + " " + aiResponse;

  const g1 = guardPediatricDosage(combinedCheck);
  if (g1) return { safeText: g1, flagged: true, guardTriggered: "pediatric_dosage" };

  const g2 = guardOverdose(combinedCheck);
  if (g2) return { safeText: g2, flagged: true, guardTriggered: "overdose" };

  const g3 = guardSelfDiagnosis(combinedCheck);
  if (g3) return { safeText: g3, flagged: true, guardTriggered: "severe_self_diagnosis" };

  return { safeText: aiResponse, flagged: false, guardTriggered: null };
}

// ============================================================================
// Logging (uses SERVICE ROLE client — api_usage_logs has no RLS yet)
// ============================================================================
async function logUsage(
  adminClient: any,
  userId: string | undefined,
  provider: string,
  requestType: string,
  tokens: number = 0,
  latencyMs: number = 0,
  outcome: string
) {
  try {
    const { error } = await adminClient.from("api_usage_logs").insert({
      user_id: userId ?? null,
      provider_name: provider,
      request_type: requestType,
      tokens_estimated: tokens,
      latency_ms: latencyMs,
      outcome,
    });
    if (error) {
      throw new Error("logUsage insert error: " + JSON.stringify(error));
    }
  } catch (err) {
    throw err;
  }
}

// ============================================================================
// Prompt builders — one per Consultant mode + Chatbot
// ============================================================================

function buildSuitabilityPrompt(query: string, context: any): string {
  return `You are MedSentry's AI Health Consultant in SUITABILITY CHECK mode.
The user wants to know if a medicine is suitable for them given their conditions and current medications.

${context.activeMeds ? `Active medications: ${context.activeMeds}` : ""}
${context.interactions ? `Known interactions with their medications: ${context.interactions}` : ""}
${context.drugInfo ? `Drug reference data: ${JSON.stringify(context.drugInfo)}` : ""}

Respond with:
1. Whether the medicine appears suitable or has concerns (be specific)
2. Any interaction warnings from their active medication list
3. A clear recommendation to confirm with their doctor or pharmacist

User query: ${query}`;
}

function buildSymptomToCarePrompt(query: string, context: any): string {
  return `You are MedSentry's AI Health Consultant in SYMPTOM-TO-CARE mode.
Analyze the user's symptoms and determine whether antibiotic or prescription medication is likely necessary.

${context.activeMeds ? `User's active medications: ${context.activeMeds}` : ""}
${context.symptoms ? `Recent symptom journal: ${context.symptoms}` : ""}

Your response MUST include this structured block at the end, on its own line:
NECESSITY_ASSESSMENT: <one of: necessary | not_necessary | unclear>

Rules:
- Mark "necessary" only if symptoms clearly indicate a condition that typically requires prescription treatment.
- Mark "not_necessary" if symptoms are consistent with self-limiting illness (viral, minor injury, etc.).
- Mark "unclear" if you cannot determine without examination.
- Always recommend professional evaluation regardless of assessment.
- AWaRe context: ${context.awareClass ? `This drug class is AWaRe tier: ${context.awareClass}` : "No specific AWaRe context provided."}

User query: ${query}`;
}

function buildVisualIdPrompt(query: string): string {
  return `You are MedSentry's AI Health Consultant in VISUAL MEDICINE IDENTIFICATION mode.
The user has uploaded an image of a medicine, pill, strip, or packaging.

Identify:
1. The likely drug name and formulation (based on visual markings, packaging text, shape/color)
2. Common uses and dosage information if identifiable
3. Any safety notes visible on the packaging
4. A reminder that visual identification is not a substitute for reading the actual label or consulting a pharmacist.

User query: ${query || "Please identify this medicine."}`;
}

function buildChatbotSystemPrompt(context: any): string {
  let prompt = `You are MedSentry's AI Health Chatbot — a conversational, routine-aware health assistant.
You have access to the user's medication and health context below. Use it to give personalized, relevant responses.
Never prescribe medications. Always recommend professional consultation for medical decisions.`;

  if (context.activeCourses?.length > 0) {
    prompt += `\n\nUser's active medication courses:\n${JSON.stringify(context.activeCourses, null, 2)}`;
  }
  if (context.doseHistory?.length > 0) {
    prompt += `\n\nRecent dose adherence (last 7 days):\n${JSON.stringify(context.doseHistory, null, 2)}`;
  }
  if (context.symptomJournal?.length > 0) {
    prompt += `\n\nRecent symptom journal entries:\n${JSON.stringify(context.symptomJournal, null, 2)}`;
  } else {
    prompt += `\n\nSymptom journal: No recent entries.`;
  }

  return prompt;
}

// ============================================================================
// Context builders — query DB using the user's anon client (respects RLS)
// ============================================================================

async function buildChatbotContext(userClient: any, userId: string | undefined) {
  if (!userId) return {};

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Active medication courses
  const { data: activeCourses } = await userClient
    .from("medication_courses")
    .select("id, custom_name, dosage_amount, frequency, instructions, days_remaining, necessity_flag, drug_id")
    .eq("user_id", userId)
    .eq("status", "active");

  // Dose history — last 7 days
  const { data: doseHistory } = await userClient
    .from("dose_logs")
    .select("taken_at, status, course_id")
    .eq("user_id", userId)
    .gte("taken_at", sevenDaysAgo)
    .order("taken_at", { ascending: false })
    .limit(50);

  // Symptom journal — last 7 days (expected empty for now per plan.md §2.8 deferral)
  const { data: symptomJournal } = await userClient
    .from("symptom_journal")
    .select("symptom, severity, status, created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  return { activeCourses: activeCourses ?? [], doseHistory: doseHistory ?? [], symptomJournal: symptomJournal ?? [] };
}

async function buildConsultantContext(userClient: any, userId: string | undefined, drugName: string | undefined) {
  if (!userId && !drugName) return {};

  let awareClass: string | null = null;
  let drugInfo: any = null;
  let interactions: any[] = [];
  let activeMeds: string[] = [];
  let symptoms: any[] = [];

  // Look up the drug in our reference table for AWaRe class + info
  if (drugName) {
    const { data: drug, error } = await userClient
      .from("drugs")
      .select("id, name, category, aware_class, common_uses, side_effects, interaction_notes")
      .ilike("name", `%${drugName}%`)
      .limit(1)
      .maybeSingle();

    if (error) console.error("Drug fetch error:", error);
    if (!drug) console.error("Drug not found for:", drugName);

    if (error) {
       awareClass = `ERROR FETCHING DRUG: ${JSON.stringify(error)}`;
    } else if (drug) {
      awareClass = drug.aware_class;
      drugInfo = drug;

      // Get the user's active drug IDs for interaction lookup
      if (userId) {
        const { data: courses } = await userClient
          .from("medication_courses")
          .select("drug_id, custom_name")
          .eq("user_id", userId)
          .eq("status", "active")
          .not("drug_id", "is", null);

        const activeIds = (courses ?? []).map((c: any) => c.drug_id).filter(Boolean);
        activeMeds = (courses ?? []).map((c: any) => c.custom_name || "Unknown");

        if (activeIds.length > 0) {
          const { data: interA } = await userClient
            .from("drug_interactions")
            .select("severity, description, severity_source")
            .eq("drug_a_id", drug.id)
            .in("drug_b_id", activeIds);

          const { data: interB } = await userClient
            .from("drug_interactions")
            .select("severity, description, severity_source")
            .eq("drug_b_id", drug.id)
            .in("drug_a_id", activeIds);

          interactions = [...(interA ?? []), ...(interB ?? [])];
        }
      }
    }
  }

  // Symptom journal context for symptom_to_care mode
  if (userId) {
    const { data: sj } = await userClient
      .from("symptom_journal")
      .select("symptom, severity, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    symptoms = sj ?? [];
  }

  return { awareClass, drugInfo, interactions, activeMeds, symptoms };
}

// ============================================================================
// Parse necessity flag from symptom_to_care AI response
// ============================================================================
function parseNecessityFlag(responseText: string): NecessityFlag | null {
  const match = responseText.match(/NECESSITY_ASSESSMENT:\s*(necessary|not_necessary|unclear)/i);
  if (!match) return null;
  return match[1].toLowerCase() as NecessityFlag;
}

// ============================================================================
// Provider callers
// ============================================================================

async function callGemini(
  key: string,
  mode: RequestType,
  messages: AIMessage[],
  imageBase64: string | undefined,
  systemPrompt: string,
  query: string
) {
  const startTime = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`;

  const contents: any[] = [];

  if (messages && messages.length > 0) {
    // Chatbot multi-turn: prepend system prompt as first user message
    contents.push({ role: "user", parts: [{ text: systemPrompt }] });
    contents.push({ role: "model", parts: [{ text: "Understood. I'm ready to help." }] });
    for (const msg of messages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  } else {
    // Consultant single-turn
    const parts: any[] = [{ text: systemPrompt }];
    if (imageBase64) {
      parts.push({ inline_data: { mime_type: "image/jpeg", data: imageBase64 } });
    }
    contents.push({ role: "user", parts });
  }

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${errBody}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { response: text, tokens: Math.floor(text.length / 4), latency: Date.now() - startTime };
  } catch (e) {
    clearTimeout(tid);
    throw e;
  }
}

async function callOpenAICompatible(
  url: string,
  key: string,
  model: string,
  messages: AIMessage[],
  systemPrompt: string
) {
  const startTime = Date.now();
  const formatted = [{ role: "system", content: systemPrompt }, ...(messages ?? [])];
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: formatted }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const tokens = data.usage?.total_tokens ?? Math.floor(text.length / 4);
    return { response: text, tokens, latency: Date.now() - startTime };
  } catch (e) {
    clearTimeout(tid);
    throw e;
  }
}

// ============================================================================
// Main handler
// ============================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const geminiKey = Deno.env.get("GEMINI_API_KEY") || "";
  const groqKey = Deno.env.get("GROQ_API_KEY") || "";
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY") || "";
  const hfKey = Deno.env.get("HUGGINGFACE_API_KEY") || "";

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // ANON client — identity verification only
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  // SERVICE ROLE client — privileged writes only (api_usage_logs)
  // SERVICE ROLE client — privileged writes only (api_usage_logs).
  // Confirmed via diagnostics that SUPABASE_SERVICE_ROLE_KEY is correctly injected by the runtime,
  // bypassing RLS.
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    // ── Identify caller ──────────────────────────────────────────────────────
    let userId: string | undefined;
    let userClient = anonClient; // default: unauthed reads
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await anonClient.auth.getUser(token);
      userId = data?.user?.id;
      // Authenticated user client — DB reads respect RLS for this user
      userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
    }

    const payload: RouterPayload = await req.json();
    const { request_type, messages = [], image_base64, userContext = {} } = payload;
    const query = userContext.query ?? messages[messages.length - 1]?.content ?? "";

    // ── Build mode-specific system prompt & context ──────────────────────────
    let systemPrompt: string;
    if (request_type === "chatbot") {
      const ctx = await buildChatbotContext(userClient, userId);
      systemPrompt = buildChatbotSystemPrompt(ctx);
    } else {
      const ctx = await buildConsultantContext(userClient, userId, userContext.drug_name);
      switch (request_type as ConsultantMode) {
        case "suitability":
          systemPrompt = buildSuitabilityPrompt(query, ctx);
          break;
        case "symptom_to_care":
          systemPrompt = buildSymptomToCarePrompt(query, ctx);
          break;
        case "visual_id":
          systemPrompt = buildVisualIdPrompt(query);
          break;
        default:
          systemPrompt = buildSuitabilityPrompt(query, ctx);
      }
    }

    // ── Tier 1: On-device (graceful skip — see plan.md §3.3 / TODO: LiteRT) ─
    await logUsage(adminClient, userId, "ondevice", request_type, 0, 0, "skipped");

    // ── Tier 2: Gemini ───────────────────────────────────────────────────────
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      try {
        const res = await callGemini(geminiKey, request_type, messages, image_base64, systemPrompt, query);
        await logUsage(adminClient, userId, "gemini", request_type, res.tokens, res.latency, "success");
        const { safeText, flagged, guardTriggered } = applyGuardrails(query, res.response);
        if (flagged) await logUsage(adminClient, userId, "guardrail", request_type, 0, 0, guardTriggered ?? "flagged");

        // Necessity flag write-back for symptom_to_care
        let necessityFlag: NecessityFlag | null = null;
        if (request_type === "symptom_to_care" && userContext.linked_course_id && userId) {
          necessityFlag = parseNecessityFlag(res.response);
          if (necessityFlag) {
            console.error(`Updating DB for ${userContext.linked_course_id} user ${userId} to ${necessityFlag}`);
            const { error: updErr, data } = await adminClient
              .from("medication_courses")
              .update({ necessity_flag: necessityFlag })
              .eq("id", userContext.linked_course_id)
              .eq("user_id", userId)
              .select();
            if (updErr) console.error("Update error:", updErr);
            else console.error("Update success:", data);
          }
        }

        return new Response(
          JSON.stringify({ text: safeText, provider: "gemini", flagged, guardTriggered, necessityFlag }),
          { headers: { ...CORS, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        console.error("Gemini failed:", err.message);
        await logUsage(adminClient, userId, "gemini", request_type, 0, 0, err.name === "AbortError" ? "timeout" : "error");
      }
    } else {
      await logUsage(adminClient, userId, "gemini", request_type, 0, 0, "skipped");
    }

    // ── Tier 3: Groq (text-only) ─────────────────────────────────────────────
    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (groqKey && !image_base64) {
      try {
        const res = await callOpenAICompatible(
          "https://api.groq.com/openai/v1/chat/completions",
          groqKey,
          "llama-3.3-70b-versatile",
          messages,
          systemPrompt
        );
        await logUsage(adminClient, userId, "groq", request_type, res.tokens, res.latency, "success");
        const { safeText, flagged, guardTriggered } = applyGuardrails(query, res.response);
        if (flagged) await logUsage(adminClient, userId, "guardrail", request_type, 0, 0, guardTriggered ?? "flagged");

        let necessityFlag: NecessityFlag | null = null;
        let dbUpdateData: any = null;
        let dbUpdateError: any = null;
        if (request_type === "symptom_to_care" && userContext.linked_course_id && userId) {
          necessityFlag = parseNecessityFlag(res.response);
          if (necessityFlag) {
            console.error(`Updating DB for ${userContext.linked_course_id} user ${userId} to ${necessityFlag}`);
            const result = await adminClient
              .from("medication_courses")
              .update({ necessity_flag: necessityFlag })
              .eq("id", userContext.linked_course_id)
              .eq("user_id", userId)
              .select();
            dbUpdateData = result.data;
            dbUpdateError = result.error;
            if (dbUpdateError) console.error("Update error:", dbUpdateError);
            else console.error("Update success:", dbUpdateData);
          }
        }

        return new Response(
          JSON.stringify({ 
            text: safeText, 
            provider: "groq", 
            flagged, 
            guardTriggered, 
            necessityFlag
          }),
          { headers: { ...CORS, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        console.error("Groq failed:", err.message);
        await logUsage(adminClient, userId, "groq", request_type, 0, 0, err.name === "AbortError" ? "timeout" : "error");
      }
    } else {
      await logUsage(adminClient, userId, "groq", request_type, 0, 0, "skipped");
    }

    // ── Tier 4: OpenRouter ───────────────────────────────────────────────────
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (openRouterKey && !image_base64) {
      try {
        const res = await callOpenAICompatible(
          "https://openrouter.ai/api/v1/chat/completions",
          openRouterKey,
          "mistralai/mixtral-8x7b-instruct",
          messages,
          systemPrompt
        );
        await logUsage(adminClient, userId, "openrouter", request_type, res.tokens, res.latency, "success");
        const { safeText, flagged, guardTriggered } = applyGuardrails(query, res.response);
        return new Response(
          JSON.stringify({ text: safeText, provider: "openrouter", flagged, guardTriggered }),
          { headers: { ...CORS, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        console.error("OpenRouter failed:", err.message);
        await logUsage(adminClient, userId, "openrouter", request_type, 0, 0, err.name === "AbortError" ? "timeout" : "error");
      }
    } else {
      await logUsage(adminClient, userId, "openrouter", request_type, 0, 0, "skipped");
    }

    // ── Tier 5: Hugging Face (text-only) ─────────────────────────────────────
    // TODO: Implement HF Inference API call when HUGGINGFACE_API_KEY is set
    const hfKey = Deno.env.get("HUGGINGFACE_API_KEY");
    await logUsage(adminClient, userId, "huggingface", request_type, 0, 0, hfKey ? "skipped" : "skipped");

    throw new Error("All AI providers exhausted, timed out, or keys missing.");

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...CORS, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

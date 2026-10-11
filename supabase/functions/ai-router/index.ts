/**
 * ai-router — MedSentry Phase 3 Edge Function
 *
 * Auth pattern (per plan.md §3.2 + user review):
 *   - Mandatory JWT verification: Every request MUST supply a valid user JWT in Authorization header.
 *     Verified via auth.getUser(token). Missing or invalid tokens return HTTP 401 immediately.
 *   - ANON key client  → used to verify the caller's JWT and perform RLS-scoped user DB reads.
 *   - SERVICE ROLE client → used ONLY for privileged DB writes and rate limit queries (api_usage_logs).
 *   - All AI provider keys live securely in Supabase secrets; never exposed to the client.
 *
 * Consultant modes (plan.md §2.5):
 *   1. suitability       — medicine-suitability check against user's active courses + conditions
 *   2. symptom_to_care   — symptom analysis with AWaRe-aware necessity flag output
 *   3. visual_id         — visual medicine identification from image
 *   4. prescription_ocr  — clinical prescription entity extraction from image
 *
 * Guardrails (plan.md §2.5 / §3.3) — three distinct, independently tested checks:
 *   Guard 1: Pediatric dosage calculation refusal
 *   Guard 2: Overdose question refusal (standalone — not conflated with Guard 3)
 *   Guard 3: Severe self-diagnosis refusal (cancer, heart attack, stroke)
 *   Applied across ALL modes (including prescription_ocr).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// Model & Rate Limit Constants
// ============================================================================

export const AI_MODELS = {
  GEMINI: "gemini-flash-lite-latest",
  GROQ: "llama-3.3-70b-versatile",
  // Note: mistralai/mixtral-8x7b-instruct was decommissioned on OpenRouter;
  // updated to current active equivalent mistralai/mixtral-8x22b-instruct.
  OPENROUTER: "mistralai/mixtral-8x22b-instruct",
} as const;

export const RATE_LIMITS = {
  PER_MINUTE: 10,
  PER_DAY: 100,
} as const;

export const PAYLOAD_LIMITS = {
  MAX_IMAGE_DECODED_BYTES: 4 * 1024 * 1024, // 4 MB decoded
  ALLOWED_IMAGE_MIMES: ["image/jpeg", "image/png", "image/webp"],
} as const;

// ============================================================================
// Types
// ============================================================================

type ConsultantMode = "suitability" | "symptom_to_care" | "visual_id" | "prescription_ocr";
type RequestType = ConsultantMode | "chatbot";
type NecessityFlag = "necessary" | "not_necessary" | "unclear";

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface RouterPayload {
  request_type?: RequestType;
  type?: RequestType;
  action?: RequestType;
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
// ============================================================================
function applyGuardrails(
  userInput: string,
  aiResponse: string
): { safeText: string; flagged: boolean; guardTriggered: string | null } {
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
// Logging (uses SERVICE ROLE client — sanitized logs with error codes only)
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
      console.error("Usage log error code: LOG_INSERT_ERR");
    }
  } catch (_err) {
    console.error("Usage log exception code: LOG_INSERT_EXC");
  }
}

// ============================================================================
// Image Payload Validator & MIME Extractor
// ============================================================================
function validateAndExtractImage(input: string): {
  valid: boolean;
  cleanBase64?: string;
  mime?: string;
  error?: string;
  code?: string;
  status?: number;
} {
  let mime: string | null = null;
  let cleanBase64 = input.trim();

  // Extract from data URI if present
  const match = cleanBase64.match(/^data:([^;]+);base64,(.+)$/s);
  if (match) {
    mime = match[1].toLowerCase();
    cleanBase64 = match[2].trim();
  }

  // Calculate decoded byte length: base64 characters encode 6 bits each
  const padding = cleanBase64.endsWith("==") ? 2 : cleanBase64.endsWith("=") ? 1 : 0;
  const decodedBytes = Math.floor((cleanBase64.length * 3) / 4) - padding;

  if (decodedBytes > PAYLOAD_LIMITS.MAX_IMAGE_DECODED_BYTES) {
    return {
      valid: false,
      error: `Payload too large: Decoded image size is ${(decodedBytes / (1024 * 1024)).toFixed(2)} MB, exceeding the 4 MB limit.`,
      code: "PAYLOAD_TOO_LARGE",
      status: 413,
    };
  }

  // Infer MIME from signature if not in data URI
  if (!mime) {
    if (cleanBase64.startsWith("/9j/")) {
      mime = "image/jpeg";
    } else if (cleanBase64.startsWith("iVBORw0KGgo")) {
      mime = "image/png";
    } else if (cleanBase64.startsWith("UklGR")) {
      mime = "image/webp";
    } else {
      try {
        const bin = atob(cleanBase64.slice(0, 32));
        const b = [bin.charCodeAt(0), bin.charCodeAt(1), bin.charCodeAt(2), bin.charCodeAt(3)];
        if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
          mime = "image/jpeg";
        } else if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
          mime = "image/png";
        } else if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) {
          mime = "image/webp";
        }
      } catch (_e) {
        // Base64 header decode failed
      }
    }
  }

  if (!mime || !PAYLOAD_LIMITS.ALLOWED_IMAGE_MIMES.includes(mime)) {
    return {
      valid: false,
      error: `Unsupported image format. Allowed formats: ${PAYLOAD_LIMITS.ALLOWED_IMAGE_MIMES.join(", ")}. Received: ${mime || "unknown"}`,
      code: "UNSUPPORTED_MEDIA_TYPE",
      status: 415,
    };
  }

  return { valid: true, cleanBase64, mime };
}

// ============================================================================
// Prompt builders
// ============================================================================

function buildSuitabilityPrompt(query: string, context: any): string {
  let prompt = "";
  if (context.allergyMatchWarning) {
    prompt += `${context.allergyMatchWarning}\n\n`;
  }
  prompt += `You are MedSentry's AI Health Consultant in SUITABILITY CHECK mode.
The user wants to know if a medicine is suitable for them given their conditions, allergies, and active medications.

${context.profile ? `User Profile:
- Name: ${context.profile.full_name || "User"}
- Age: ${context.profile.age ?? "Not specified"} | Weight: ${context.profile.weight_kg ? context.profile.weight_kg + " kg" : "Not specified"}
- Known Conditions: ${context.profile.known_conditions?.join(", ") || "None recorded"}
- Recorded Allergies: ${context.profile.allergies?.join(", ") || "None recorded"}` : ""}

${context.activeMeds?.length > 0 ? `Active medications: ${context.activeMeds.join(", ")}` : "No active medications."}
${context.interactions?.length > 0 ? `Known drug interactions: ${JSON.stringify(context.interactions)}` : ""}
${context.drugInfo ? `Drug reference data: ${JSON.stringify(context.drugInfo)}` : ""}

Respond with:
1. Direct suitability assessment (highlighting any allergy or pre-existing condition conflict)
2. Any interaction warnings from active medications
3. A clear recommendation to confirm with a doctor or pharmacist

User query: ${query}`;
  return prompt;
}

function buildSymptomToCarePrompt(query: string, context: any): string {
  let prompt = "";
  if (context.allergyMatchWarning) {
    prompt += `${context.allergyMatchWarning}\n\n`;
  }
  prompt += `You are MedSentry's AI Health Consultant in SYMPTOM-TO-CARE mode.
Analyze the user's symptoms in the context of their profile and active medications.

${context.profile ? `User Profile:
- Age: ${context.profile.age ?? "Not specified"}
- Known Conditions: ${context.profile.known_conditions?.join(", ") || "None recorded"}
- Recorded Allergies: ${context.profile.allergies?.join(", ") || "None recorded"}` : ""}

${context.activeMeds?.length > 0 ? `User's active medications: ${context.activeMeds.join(", ")}` : ""}
${context.symptoms?.length > 0 ? `Recent symptom journal: ${JSON.stringify(context.symptoms)}` : ""}

Your response MUST include this structured block at the end, on its own line:
NECESSITY_ASSESSMENT: <one of: necessary | not_necessary | unclear>

Rules:
- Mark "necessary" only if symptoms clearly indicate a condition that typically requires prescription treatment.
- Mark "not_necessary" if symptoms are consistent with self-limiting illness.
- Mark "unclear" if you cannot determine without examination.
- Always recommend professional evaluation regardless of assessment.
- AWaRe context: ${context.awareClass ? `This drug class is AWaRe tier: ${context.awareClass}` : "No specific AWaRe context provided."}

User query: ${query}`;
  return prompt;
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

function buildPrescriptionOcrPrompt(): string {
  return `You are MedSentry's clinical prescription extraction assistant.
The user has uploaded an image of a medical prescription (which may be handwritten in cursive, typed, or a mixed doctor's script).
Analyze the entire image and extract all patient, doctor, and prescription details.

Strict Instructions:
1. Accurately decipher doctors' cursive handwriting, clinical shorthand, and Latin abbreviations (e.g. Rx, OD, BD, BID, TID, QID, HS, SOS, PC, AC, STAT).
2. Frequency normalization:
   - "1-0-1" or "BD" / "BID" -> ["morning", "night"]
   - "1-1-1" or "TID" -> ["morning", "afternoon", "night"]
   - "1-0-0" or "OD" -> ["morning"]
   - "0-0-1" or "HS" / "bedtime" -> ["night"]
   - "SOS" / "as needed" -> ["as needed"]
3. Format instructions cleanly (e.g. "After meals", "Before food", "With plenty of water").
4. Return ONLY a single raw JSON object matching this exact schema:
{
  "patientName": "Extracted patient name or empty string",
  "age": "Extracted age or empty string",
  "weight": "Extracted weight or empty string",
  "height": "Extracted height or empty string",
  "conditions": ["Array of diagnosed conditions or symptoms"],
  "doctorReg": "Doctor name or registration number or empty string",
  "prescriptionDate": "YYYY-MM-DD or empty string",
  "medicines": [
    {
      "name": "Medicine or drug name (brand or generic)",
      "dosage": "Dosage with unit e.g. 500mg, 10ml, 1 tablet",
      "frequency": ["morning", "night"],
      "instructions": "e.g. After meals",
      "durationDays": 7
    }
  ]
}

Do NOT wrap the response in markdown blocks like \`\`\`json. Return ONLY the raw valid JSON string.`;
}

function buildChatbotSystemPrompt(context: any): string {
  let prompt = `You are MedSentry's AI Health Chatbot — a conversational, routine-aware health assistant.
You have access to the user's health profile, medication list, adherence history, and symptom journal below.
Use this context to provide highly personalized, relevant responses.
Never prescribe medications. Always recommend professional consultation for medical decisions.`;

  if (context.profile) {
    prompt += `\n\nUser Profile:
- Name: ${context.profile.full_name || "User"}
- Age: ${context.profile.age ?? "Not specified"} | Weight: ${context.profile.weight_kg ? context.profile.weight_kg + " kg" : "Not specified"}
- Known Conditions: ${context.profile.known_conditions?.join(", ") || "None recorded"}
- Recorded Allergies: ${context.profile.allergies?.join(", ") || "None recorded"}`;
  }

  if (context.adherenceSummary) {
    prompt += `\n\nAdherence Summary: ${context.adherenceSummary}`;
  }

  if (context.activeCourses?.length > 0) {
    prompt += `\n\nUser's active medication courses:\n${JSON.stringify(context.activeCourses, null, 2)}`;
  }

  if (context.symptomJournal?.length > 0) {
    prompt += `\n\nRecent symptom journal entries:\n${JSON.stringify(context.symptomJournal, null, 2)}`;
  } else {
    prompt += `\n\nSymptom journal: No recent entries.`;
  }

  return prompt;
}

// ============================================================================
// Context builders (query DB using user's RLS-scoped client)
// ============================================================================

async function buildChatbotContext(userClient: any, userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // User profile demographics & medical history
  const { data: profile } = await userClient
    .from("profiles")
    .select("full_name, age, weight_kg, height_cm, known_conditions, allergies, preferred_language")
    .eq("id", userId)
    .maybeSingle();

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

  const totalLogged = doseHistory?.length ?? 0;
  const takenCount = doseHistory?.filter((d: any) => d.status === "taken").length ?? 0;
  const adherenceRate = totalLogged > 0 ? Math.round((takenCount / totalLogged) * 100) : null;
  const adherenceSummary =
    adherenceRate !== null
      ? `${adherenceRate}% adherence (${takenCount}/${totalLogged} doses logged as taken in last 7 days)`
      : "No recent dose log data in last 7 days";

  // Symptom journal — last 7 days
  const { data: symptomJournal } = await userClient
    .from("symptom_journal")
    .select("symptom, severity, status, duration_onset, category_location, created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    profile: profile ?? null,
    activeCourses: activeCourses ?? [],
    doseHistory: doseHistory ?? [],
    adherenceSummary,
    symptomJournal: symptomJournal ?? [],
  };
}

async function buildConsultantContext(userClient: any, userId: string, drugName: string | undefined) {
  let awareClass: string | null = null;
  let drugInfo: any = null;
  let interactions: any[] = [];
  let activeMeds: string[] = [];
  let symptoms: any[] = [];
  let profile: any = null;
  let allergyMatchWarning: string | null = null;

  const { data: p } = await userClient
    .from("profiles")
    .select("full_name, age, weight_kg, height_cm, known_conditions, allergies")
    .eq("id", userId)
    .maybeSingle();
  profile = p ?? null;

  // Look up the drug in our reference table for AWaRe class + info
  if (drugName) {
    const { data: drug, error } = await userClient
      .from("drugs")
      .select("id, name, category, aware_class, common_uses, side_effects, interaction_notes")
      .ilike("name", `%${drugName}%`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Drug fetch error code: DRUG_FETCH_ERR");
    }

    if (drug) {
      awareClass = drug.aware_class;
      drugInfo = drug;

      // Deterministic server-side allergy pre-check against user's recorded allergies
      if (profile?.allergies && Array.isArray(profile.allergies) && profile.allergies.length > 0) {
        const drugTargetText = `${drug.name || ""} ${drug.category || ""} ${drug.aware_class || ""}`.toLowerCase();
        for (const allergy of profile.allergies) {
          const allergyTerm = String(allergy).trim().toLowerCase();
          if (allergyTerm.length >= 3 && drugTargetText.includes(allergyTerm)) {
            allergyMatchWarning = `CRITICAL SAFETY WARNING: The user has a recorded allergy to '${allergy}'. The target drug '${drug.name}' matches this allergy category ('${drug.category || drug.name}'). YOU MUST LEAD YOUR RESPONSE WITH AN EXPLICIT, HIGH-PRIORITY ALLERGY WARNING IN BOLD BEFORE ANY OTHER ANALYSIS.`;
            break;
          }
        }
      }

      // Look up active medication courses for interactions
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

  // Symptom journal context for symptom_to_care mode
  const { data: sj } = await userClient
    .from("symptom_journal")
    .select("symptom, severity, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  symptoms = sj ?? [];

  return { profile, awareClass, drugInfo, interactions, activeMeds, symptoms, allergyMatchWarning };
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
  messages: AIMessage[],
  imageBase64: string | undefined,
  imageMime: string,
  systemPrompt: string
) {
  const startTime = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODELS.GEMINI}:generateContent?key=${key}`;

  const contents: any[] = [];

  if (messages && messages.length > 0) {
    contents.push({ role: "user", parts: [{ text: systemPrompt }] });
    contents.push({ role: "model", parts: [{ text: "Understood. I'm ready to help." }] });
    for (const msg of messages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  } else {
    const parts: any[] = [{ text: systemPrompt }];
    if (imageBase64) {
      parts.push({ inline_data: { mime_type: imageMime, data: imageBase64 } });
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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // ANON client for identity verification only
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  // SERVICE ROLE client for logging and rate limit queries
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1. Mandatory JWT Authentication Gate
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid Authorization header. A valid user JWT is required.", code: "AUTH_REQUIRED" }),
      { headers: { ...CORS, "Content-Type": "application/json" }, status: 401 }
    );
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: authData, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !authData?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Invalid or expired session token.", code: "AUTH_INVALID" }),
      { headers: { ...CORS, "Content-Type": "application/json" }, status: 401 }
    );
  }

  const userId = authData.user.id;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    // 2. Per-User Rate Limiting (10 req/min, 100 req/day)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: minCount, error: minErr } = await adminClient
      .from("api_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneMinuteAgo);

    if (!minErr && (minCount ?? 0) >= RATE_LIMITS.PER_MINUTE) {
      return new Response(
        JSON.stringify({
          error: `Rate limit exceeded: You have exceeded the limit of ${RATE_LIMITS.PER_MINUTE} requests per minute. Please try again shortly.`,
          code: "RATE_LIMIT_PER_MINUTE"
        }),
        { headers: { ...CORS, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dayCount, error: dayErr } = await adminClient
      .from("api_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo);

    if (!dayErr && (dayCount ?? 0) >= RATE_LIMITS.PER_DAY) {
      return new Response(
        JSON.stringify({
          error: `Daily limit exceeded: You have reached the maximum quota of ${RATE_LIMITS.PER_DAY} requests per day.`,
          code: "RATE_LIMIT_PER_DAY"
        }),
        { headers: { ...CORS, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // 3. Parse JSON Body
    let payload: RouterPayload;
    try {
      payload = await req.json();
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request payload.", code: "BAD_REQUEST" }),
        { headers: { ...CORS, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const request_type: RequestType = payload.request_type || payload.type || payload.action || "chatbot";
    const messages = payload.messages || [];
    let image_base64 = payload.image_base64;
    let imageMime = "image/jpeg";
    const userContext = payload.userContext || {};
    const query = userContext.query ?? messages[messages.length - 1]?.content ?? "";

    // 4. Payload & Image Validation (4 MB decoded max, MIME whitelist)
    if (image_base64) {
      const validation = validateAndExtractImage(image_base64);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: validation.error, code: validation.code }),
          { headers: { ...CORS, "Content-Type": "application/json" }, status: validation.status }
        );
      }
      image_base64 = validation.cleanBase64;
      imageMime = validation.mime!;
    }

    // 5. Build mode-specific system prompt & context
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
        case "prescription_ocr":
          systemPrompt = buildPrescriptionOcrPrompt();
          break;
        default:
          systemPrompt = buildSuitabilityPrompt(query, ctx);
      }
    }

    // ── Tier 1: On-device (architectural skip / LiteRT stub) ────────────────
    await logUsage(adminClient, userId, "ondevice", request_type, 0, 0, "skipped");

    // ── Tier 2: Gemini ───────────────────────────────────────────────────────
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      try {
        const res = await callGemini(geminiKey, messages, image_base64, imageMime, systemPrompt);
        await logUsage(adminClient, userId, "gemini", request_type, res.tokens, res.latency, "success");

        // Universal guardrails enforcement across all modes (including prescription_ocr)
        const { safeText, flagged, guardTriggered } = applyGuardrails(query, res.response);
        if (flagged) {
          await logUsage(adminClient, userId, "guardrail", request_type, 0, 0, guardTriggered ?? "flagged");
        }

        // Necessity flag write-back for symptom_to_care
        let necessityFlag: NecessityFlag | null = null;
        if (request_type === "symptom_to_care" && userContext.linked_course_id && !flagged) {
          necessityFlag = parseNecessityFlag(res.response);
          if (necessityFlag) {
            const { error: updErr } = await adminClient
              .from("medication_courses")
              .update({ necessity_flag: necessityFlag })
              .eq("id", userContext.linked_course_id)
              .eq("user_id", userId);
            if (updErr) console.error("Course flag update error code: FLAG_UPDATE_ERR");
          }
        }

        // Parse structured prescription JSON if in prescription_ocr mode
        let parsed: any = null;
        if (request_type === "prescription_ocr") {
          if (flagged) {
            parsed = null;
          } else {
            try {
              const raw = res.response.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
              parsed = JSON.parse(raw);
            } catch (_parseErr) {
              console.error("Prescription JSON parse error code: PARSE_ERR");
            }
          }
        }

        return new Response(
          JSON.stringify({ text: safeText, provider: "gemini", flagged, guardTriggered, necessityFlag, parsed }),
          { headers: { ...CORS, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        console.error("Gemini failed code: GEMINI_CALL_ERR");
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
          AI_MODELS.GROQ,
          messages,
          systemPrompt
        );
        await logUsage(adminClient, userId, "groq", request_type, res.tokens, res.latency, "success");

        const { safeText, flagged, guardTriggered } = applyGuardrails(query, res.response);
        if (flagged) {
          await logUsage(adminClient, userId, "guardrail", request_type, 0, 0, guardTriggered ?? "flagged");
        }

        let necessityFlag: NecessityFlag | null = null;
        if (request_type === "symptom_to_care" && userContext.linked_course_id && !flagged) {
          necessityFlag = parseNecessityFlag(res.response);
          if (necessityFlag) {
            const { error: updErr } = await adminClient
              .from("medication_courses")
              .update({ necessity_flag: necessityFlag })
              .eq("id", userContext.linked_course_id)
              .eq("user_id", userId);
            if (updErr) console.error("Course flag update error code: FLAG_UPDATE_ERR");
          }
        }

        return new Response(
          JSON.stringify({
            text: safeText,
            provider: "groq",
            flagged,
            guardTriggered,
            necessityFlag,
          }),
          { headers: { ...CORS, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        console.error("Groq failed code: GROQ_CALL_ERR");
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
          AI_MODELS.OPENROUTER,
          messages,
          systemPrompt
        );
        await logUsage(adminClient, userId, "openrouter", request_type, res.tokens, res.latency, "success");

        const { safeText, flagged, guardTriggered } = applyGuardrails(query, res.response);
        if (flagged) {
          await logUsage(adminClient, userId, "guardrail", request_type, 0, 0, guardTriggered ?? "flagged");
        }

        return new Response(
          JSON.stringify({ text: safeText, provider: "openrouter", flagged, guardTriggered }),
          { headers: { ...CORS, "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        console.error("OpenRouter failed code: OPENROUTER_CALL_ERR");
        await logUsage(adminClient, userId, "openrouter", request_type, 0, 0, err.name === "AbortError" ? "timeout" : "error");
      }
    } else {
      await logUsage(adminClient, userId, "openrouter", request_type, 0, 0, "skipped");
    }

    // ── Tier 5: Hugging Face (text-only stub) ─────────────────────────────────
    // Architectural fallback stub: documented per project requirements.
    // Intentionally not connected to a live inference endpoint at this time.
    await logUsage(adminClient, userId, "huggingface", request_type, 0, 0, "skipped");

    return new Response(
      JSON.stringify({ error: "All AI providers exhausted, timed out, or unavailable.", code: "PROVIDERS_UNAVAILABLE" }),
      { headers: { ...CORS, "Content-Type": "application/json" }, status: 503 }
    );

  } catch (error: any) {
    console.error("Unhandled handler error code: HANDLER_ERR");
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error", code: "INTERNAL_ERROR" }),
      { headers: { ...CORS, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

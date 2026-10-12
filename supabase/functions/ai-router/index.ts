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

type ConsultantMode = "suitability" | "symptom_to_care" | "visual_id" | "prescription_ocr" | "consultant";
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
  query?: string;
  image_base64?: string;
  userContext?: {
    userId?: string;
    query?: string;
    linked_course_id?: string;  // for necessity_flag write-back
    drug_name?: string;         // for AWaRe lookup context
  };
}

export interface RetrievedMedicine {
  id?: string;
  name: string;
  generic_name: string;
  brand_names?: string[];
  active_ingredients?: string[];
  strength?: string;
  dosage_form?: string;
  route?: string;
  prescription_status: "OTC" | "prescription_only" | "restricted" | "unverified";
  schedule_category: string;
  status_verification: "verified_authoritative" | "provisional_evidence" | "unverified";
  legal_basis?: string;
  source_organization?: string;
  source_url?: string;
  source_version?: string;
  indications?: string;
  contraindications?: string;
  precautions?: string;
  adverse_effects?: string;
  max_otc_dose_adult?: string;
  classification_notes?: string;
  aware_class?: string | null;
}

export interface InteractionFinding {
  drug_a: string;
  drug_b: string;
  severity: string;
  description: string;
  source: string;
  is_documented: boolean;
}

export interface KnowledgeRetrievalResult {
  matchedMedicines: RetrievedMedicine[];
  interactions: InteractionFinding[];
  sources: { title: string; url?: string; version?: string }[];
  warnings: string[];
  limitations: string[];
}

// ============================================================================
// Guard 1: Pediatric dosage refusal
// ============================================================================
export function guardPediatricDosage(text: string): string | null {
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
export function guardOverdose(text: string): string | null {
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
    return "I cannot answer questions about overdose amounts or lethal doses. If you or someone you know is in danger, call emergency services (112 in India / 911), a crisis helpline (such as Vandrevala Foundation or Tele-MANAS), or a poison control center immediately.";
  }
  return null;
}

// ============================================================================
// Guard 3: Severe self-diagnosis refusal (separate from Guard 2)
// ============================================================================
export function guardSelfDiagnosis(text: string): string | null {
  const lower = text.toLowerCase();
  const severeTerms = [
    "cancer",
    "heart attack",
    "stroke",
    "myocardial infarction",
    "tumor",
    "chest pain",
    "crushing chest pain",
  ];
  if (severeTerms.some((t) => lower.includes(t))) {
    return "Your question describes a potentially serious or emergency medical condition (such as acute chest pain, stroke, or heart attack). Please call emergency ambulance services (112 in India) or see a qualified healthcare professional immediately — do not rely on AI for this.";
  }
  return null;
}

// ============================================================================
// Guard 4: Adversarial safety jailbreak refusal
// ============================================================================
export function guardJailbreak(text: string): string | null {
  const lower = text.toLowerCase();
  const jailbreakTerms = [
    "dan mode",
    "jailbreak",
    "ignore all medical safety instructions",
    "ignore previous instructions",
    "pretend you are",
    "bypass a pharmacy",
    "without a prescription",
  ];
  if (jailbreakTerms.some((t) => lower.includes(t)) && (lower.includes("bypass") || lower.includes("without a prescription") || lower.includes("dan mode") || lower.includes("jailbreak"))) {
    return "I cannot assist with requests to bypass pharmacy regulations or acquire prescription medications without a prescription. Please consult a licensed doctor or registered medical practitioner.";
  }
  return null;
}

// ============================================================================
// Apply all guardrails in order
// ============================================================================
export function applyGuardrails(
  userInput: string,
  aiResponse: string
): { safeText: string; flagged: boolean; guardTriggered: string | null } {
  // 1. Evaluate user query for emergency red flags, pediatric dosing, overdose queries, and adversarial jailbreaks
  const g1User = guardPediatricDosage(userInput);
  if (g1User) return { safeText: g1User, flagged: true, guardTriggered: "pediatric_dosage" };

  const g2User = guardOverdose(userInput);
  if (g2User) return { safeText: g2User, flagged: true, guardTriggered: "overdose" };

  const g3User = guardSelfDiagnosis(userInput);
  if (g3User) return { safeText: g3User, flagged: true, guardTriggered: "severe_self_diagnosis" };

  const g4User = guardJailbreak(userInput);
  if (g4User) return { safeText: g4User, flagged: true, guardTriggered: "adversarial_jailbreak" };

  // 2. Evaluate model output for dangerous compliance (overdose calculations or pediatric calculations)
  const g1Model = guardPediatricDosage(aiResponse);
  if (g1Model) return { safeText: g1Model, flagged: true, guardTriggered: "pediatric_dosage" };

  const g2Model = guardOverdose(aiResponse);
  if (g2Model) return { safeText: g2Model, flagged: true, guardTriggered: "overdose" };

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

  if (!mime || !(PAYLOAD_LIMITS.ALLOWED_IMAGE_MIMES as readonly string[]).includes(mime)) {
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

export function buildSuitabilityPrompt(query: string, context: any, hasImage = false): string {
  let prompt = "";
  if (context.allergyMatchWarning) {
    prompt += `${context.allergyMatchWarning}\n\n`;
  }
  prompt += `You are MedSentry's AI Health Consultant in SUITABILITY & MEDICATION CONSULTATION mode for India.
The user wants to know if a medicine is suitable for them, or understand its uses, composition, and safety given their profile, conditions, allergies, active medications, and Indian regulatory classification.

${context.profile ? `User Profile:
- Name: ${context.profile.full_name || "User"}
- Age: ${context.profile.age ?? "Not specified"} | Weight: ${context.profile.weight_kg ? context.profile.weight_kg + " kg" : "Not specified"}
- Known Conditions: ${context.profile.known_conditions?.join(", ") || "None recorded"}
- Recorded Allergies: ${context.profile.allergies?.join(", ") || "None recorded"}` : ""}

${context.activeMeds?.length > 0 ? `Active medications: ${context.activeMeds.join(", ")}` : "No active medications."}

${context.drugInfo ? `Drug Reference & Regulatory Data (India):
- Medicine Name: ${context.drugInfo.name} ${context.drugInfo.generic_name ? `(${context.drugInfo.generic_name})` : ""}
- Brand Names in India: ${context.drugInfo.brand_names?.join(", ") || "N/A"}
- Active Ingredients: ${context.drugInfo.active_ingredients?.join(" + ") || context.drugInfo.name}
- Indian Prescription Status: ${context.drugInfo.prescription_status_india || context.drugInfo.prescription_status || "unverified"} [${context.drugInfo.schedule_category_india || context.drugInfo.schedule_category || "unverified"}]
- Status Verification: ${context.drugInfo.status_verification || "unverified"}
- Legal Basis: ${context.drugInfo.legal_basis || context.drugInfo.classification_notes || "Drugs and Cosmetics Rules 1945"}
- Regulatory Source: ${context.drugInfo.source_organization || context.drugInfo.verification_source || "CDSCO"} (${context.drugInfo.source_url || "https://cdsco.gov.in/"})
- AWaRe Classification: ${context.drugInfo.aware_class || "N/A"}
- Approved Indications: ${context.drugInfo.indications || context.drugInfo.common_uses || "N/A"}
- Contraindications: ${context.drugInfo.contraindications || "N/A"}
- Precautions: ${context.drugInfo.precautions || "N/A"}
- Max Adult OTC Dose: ${context.drugInfo.max_otc_dose_adult || "N/A"}` : ""}

${context.interactions?.length > 0 ? `Drug Interactions Assessment:
${context.interactions.map((it: any) => `- ${it.description} (Severity: ${it.severity || "unclassified"}, Source: ${it.source || it.severity_source || "database"})`).join("\n")}` : ""}

${hasImage ? `CRITICAL VISUAL IDENTIFICATION & CLINICAL GUIDANCE INSTRUCTIONS:
An image of a medicine blister pack, strip, box, bottle, or symptom has been provided.
1. Visually examine the image carefully: read all printed text, markings, brand name (e.g. Daflon 500), generic composition (e.g. Micronized Purified Flavonoid Fraction), dosage strength, and manufacturer.
2. State the identified medicine clearly in your response. DO NOT claim the user did not provide the medicine name if it is legible or identifiable in the image.
3. Explain what this medicine is used for (indications), how it works (mechanism of action), and standard clinical usage.
4. Assess suitability for the patient (${context.profile?.full_name || "the user"}) based on their recorded conditions (${context.profile?.known_conditions?.join(", ") || "None recorded"}), allergies (${context.profile?.allergies?.join(", ") || "None recorded"}), and active medications (${context.activeMeds?.join(", ") || "None recorded"}). Specifically evaluate potential drug interactions.
5. Specify its official regulatory classification in India under CDSCO and Drugs & Cosmetics Rules 1945 (e.g. Schedule H Prescription-Only vs Schedule K OTC).
6. Provide clear precautions and always remind the user to consult a registered medical practitioner or pharmacist before starting or stopping medication.` : `CRITICAL CLINICAL & STATUTORY INSTRUCTIONS:
1. Direct suitability assessment (highlighting any allergy, liver/kidney conflict, or disease interaction).
2. Sourced prescription classification in India: Cite the legal basis (e.g. Schedule K Item 23 for household OTC remedies; Schedule H/H1 for prescription drugs). Note that ALL systemic antibiotics are strictly Prescription Only in India.
3. Interaction status: If documented, explain the risk. If unlisted, state that no interaction is documented in the database, but absence of a record is NOT proof of safety.
4. Clear recommendation to confirm with a doctor or licensed pharmacist before taking.
5. If the drug status is 'unverified', explicitly state that its official Indian OTC status is unverified under CDSCO Gazette lists and do not guess.`}

User query: ${query || (hasImage ? "Please inspect the attached medicine image, explain what it is used for, and verify its suitability and safety." : "")}`;
  return prompt;
}

export function buildSymptomToCarePrompt(query: string, context: any): string {
  let prompt = "";
  if (context.allergyMatchWarning) {
    prompt += `${context.allergyMatchWarning}\n\n`;
  }
  prompt += `You are MedSentry's AI Health Consultant in SYMPTOM-TO-CARE mode for India.
Analyze the user's symptoms in the context of their profile, active medications, and clinical necessity.

${context.profile ? `User Profile:
- Age: ${context.profile.age ?? "Not specified"}
- Known Conditions: ${context.profile.known_conditions?.join(", ") || "None recorded"}
- Recorded Allergies: ${context.profile.allergies?.join(", ") || "None recorded"}` : ""}

${context.activeMeds?.length > 0 ? `User's active medications: ${context.activeMeds.join(", ")}` : ""}
${context.symptoms?.length > 0 ? `Recent symptom journal: ${JSON.stringify(context.symptoms)}` : ""}

${context.drugInfo ? `Target Medicine Reference:
- Name: ${context.drugInfo.name}
- Indian Prescription Status: ${context.drugInfo.prescription_status_india || context.drugInfo.prescription_status || "unverified"} [${context.drugInfo.schedule_category_india || context.drugInfo.schedule_category || "unverified"}]
- AWaRe Classification: ${context.awareClass ? `${context.awareClass} (WHO antibiotic stewardship classification — NOT permission for OTC purchase or self-medication)` : "N/A"}` : ""}

Your response MUST include this structured block at the end, on its own line:
NECESSITY_ASSESSMENT: <one of: necessary | not_necessary | unclear>

Rules:
- Mark "necessary" only if symptoms clearly indicate a condition that typically requires prescription treatment or urgent clinical evaluation.
- Mark "not_necessary" if symptoms are consistent with self-limiting illness suitable for supportive self-care.
- Mark "unclear" if you cannot determine without physical examination.
- Remind user that antibiotics (Schedule H/H1) must never be started without a doctor's examination and prescription.
- Always recommend professional evaluation regardless of assessment.

User query: ${query}`;
  return prompt;
}

export function buildVisualIdPrompt(query: string): string {
  return `You are MedSentry's AI Health Consultant in VISUAL MEDICINE IDENTIFICATION mode.
The user has uploaded an image of a medicine, pill, strip, or packaging.

Identify:
1. The likely drug name and formulation (based on visual markings, packaging text, shape/color)
2. Common uses and dosage information if identifiable
3. Any safety notes visible on the packaging
4. A reminder that visual identification is not a substitute for reading the actual label or consulting a pharmacist.

User query: ${query || "Please identify this medicine."}`;
}

export function buildPrescriptionOcrPrompt(): string {
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

export function extractCandidateTerms(text: string): string[] {
  if (!text) return [];
  const stopwords = new Set([
    "can", "i", "take", "with", "and", "or", "is", "a", "an", "the", "for", "my",
    "to", "of", "in", "what", "how", "prescription", "otc", "medicine", "medicines",
    "pill", "pills", "tablet", "tablets", "capsule", "dose", "dosage", "doctor",
    "fever", "pain", "cough", "cold", "safe", "together", "any", "are", "about",
    "should", "would", "could", "have", "been", "using", "taking", "help", "give",
    "need", "which", "when", "where", "why", "does", "will", "from"
  ]);

  const clean = text.replace(/[^a-zA-Z0-9\s]/g, " ");
  const rawWords = clean.split(/\s+/).filter(Boolean);
  const candidates: string[] = [];

  // Unigrams first (length >= 3, not in stopwords)
  for (const w of rawWords) {
    if (w.length >= 3 && !stopwords.has(w.toLowerCase())) {
      candidates.push(w);
    }
  }

  // Meaningful bigrams (e.g. "Dolo 650", "Povidone Iodine", "Calamine Lotion")
  for (let i = 0; i < rawWords.length - 1; i++) {
    const w1 = rawWords[i].toLowerCase();
    const w2 = rawWords[i + 1].toLowerCase();
    if (!stopwords.has(w1) || !stopwords.has(w2)) {
      const bg = `${rawWords[i]} ${rawWords[i + 1]}`.trim();
      if (bg.length >= 4) candidates.push(bg);
    }
  }

  return [...new Set(candidates)];
}

// In-memory formulary cache (60-second TTL) to minimize redundant database round-trips
let _cachedFormulary: any[] | null = null;
let _lastFormularyFetch = 0;

export async function retrieveKnowledge(
  userClient: any,
  candidateTerms: string[],
  activeCourses: any[] = []
): Promise<KnowledgeRetrievalResult> {
  const matchedMedicines: RetrievedMedicine[] = [];
  const sourcesMap = new Map<string, { title: string; url?: string; version?: string }>();
  const warnings: string[] = [];
  const limitations: string[] = [];

  // 1. Query public.medication_formulary_india (cached)
  const now = Date.now();
  if (!_cachedFormulary || now - _lastFormularyFetch > 60000) {
    const { data: formularyRows } = await userClient
      .from("medication_formulary_india")
      .select("*");
    if (formularyRows && formularyRows.length > 0) {
      _cachedFormulary = formularyRows;
      _lastFormularyFetch = now;
    }
  }

  const formularyList = _cachedFormulary ?? [];
  const lowerCandidates = candidateTerms.map((t) => t.toLowerCase());

  for (const f of formularyList) {
    const genLower = (f.generic_name || "").toLowerCase();
    const brandsLower = (f.brand_names || []).map((b: string) => b.toLowerCase());
    const ingrLower = (f.active_ingredients || []).map((i: string) => i.toLowerCase());

    const isMatch = lowerCandidates.some((cand) =>
      genLower.includes(cand) ||
      cand.includes(genLower) ||
      brandsLower.some((b: string) => b.includes(cand) || cand.includes(b)) ||
      ingrLower.some((i: string) => i.includes(cand) || cand.includes(i))
    );

    if (isMatch) {
      matchedMedicines.push({
        name: f.generic_name,
        generic_name: f.generic_name,
        brand_names: f.brand_names,
        active_ingredients: f.active_ingredients,
        strength: f.strength,
        dosage_form: f.dosage_form,
        route: f.route,
        prescription_status: f.prescription_status,
        schedule_category: f.schedule_category,
        status_verification: f.status_verification,
        legal_basis: f.legal_basis,
        source_organization: f.source_organization,
        source_url: f.source_url,
        source_version: f.source_version,
        indications: f.indications,
        contraindications: f.contraindications,
        precautions: f.precautions,
        adverse_effects: f.adverse_effects,
        max_otc_dose_adult: f.max_otc_dose_adult,
        classification_notes: f.classification_notes,
      });

      if (f.source_organization) {
        sourcesMap.set(f.source_organization, {
          title: f.source_organization,
          url: f.source_url,
          version: f.source_version,
        });
      }
    }
  }

  // Resolve catalog ID from public.drugs for matched formulary items
  for (const m of matchedMedicines) {
    if (!m.id) {
      const { data: dMatch } = await userClient
        .from("drugs")
        .select("id, aware_class")
        .or(`name.ilike.%${m.generic_name}%,generic_name.ilike.%${m.generic_name}%`)
        .limit(1);
      if (dMatch && dMatch.length > 0) {
        m.id = dMatch[0].id;
        if (!m.aware_class && dMatch[0].aware_class) {
          m.aware_class = dMatch[0].aware_class;
        }
      }
    }
  }

  // 2. Query public.drugs for catalog matches in parallel
  const termsToQuery = candidateTerms.slice(0, 8);
  if (termsToQuery.length > 0) {
    const queryPromises = termsToQuery.map((term) =>
      userClient
        .from("drugs")
        .select(`
          id, name, generic_name, category, aware_class, brand_names, active_ingredients,
          strength, dosage_form, route, indications, contraindications, precautions,
          prescription_status_india, schedule_category_india, status_verification,
          verification_source, source_url, source_version, verification_date, classification_notes
        `)
        .or(`name.ilike.${term},name.ilike.${term} %,name.ilike.% ${term}%,generic_name.ilike.${term},generic_name.ilike.${term} %,generic_name.ilike.% ${term}%`)
        .limit(3)
    );
    const queryResults = await Promise.all(queryPromises);

    for (const qRes of queryResults) {
      for (const d of qRes.data ?? []) {
        const alreadyIn = matchedMedicines.find(
          (m) => m.generic_name.toLowerCase() === (d.generic_name || d.name).toLowerCase()
        );
        if (alreadyIn) {
          if (!alreadyIn.id) alreadyIn.id = d.id;
          if (!alreadyIn.aware_class) alreadyIn.aware_class = d.aware_class;
        } else {
          matchedMedicines.push({
            id: d.id,
            name: d.name,
            generic_name: d.generic_name || d.name,
            brand_names: d.brand_names,
            active_ingredients: d.active_ingredients,
            strength: d.strength,
            dosage_form: d.dosage_form,
            route: d.route,
            prescription_status: d.prescription_status_india || "unverified",
            schedule_category: d.schedule_category_india || "unverified",
            status_verification: d.status_verification || "unverified",
            legal_basis: d.classification_notes,
            source_organization: d.verification_source,
            source_url: d.source_url,
            source_version: d.source_version,
            indications: d.indications,
            contraindications: d.contraindications,
            precautions: d.precautions,
            classification_notes: d.classification_notes,
            aware_class: d.aware_class,
          });

          if (d.verification_source) {
            sourcesMap.set(d.verification_source, {
              title: d.verification_source,
              url: d.source_url,
              version: d.source_version,
            });
          }
        }
      }
    }
  }

  // Check for antibiotic warning & unverified limitations
  for (const m of matchedMedicines) {
    if (m.aware_class || m.schedule_category.includes("Schedule H")) {
      warnings.push(`Under Indian regulatory law (CDSCO & Drugs and Cosmetics Rules 1945), ${m.name} is classified as ${m.schedule_category} (Prescription-Only). Retail dispensing without a valid doctor's prescription is prohibited under Rule 65.`);
    }
    if (m.prescription_status === "unverified") {
      limitations.push(`The official Indian OTC classification for ${m.name} could not be established from authoritative CDSCO lists. Status marked as 'unverified'.`);
    }
  }

  // 3. Drug-Drug Interactions Lookup
  const catalogDrugMap = new Map<string, string>();
  for (const m of matchedMedicines) {
    if (m.id) catalogDrugMap.set(m.id, m.name);
  }
  for (const c of activeCourses) {
    if (c.drug_id) catalogDrugMap.set(c.drug_id, c._displayName);
  }

  const allIds = Array.from(catalogDrugMap.keys());
  const interactions: InteractionFinding[] = [];

  if (allIds.length >= 2) {
    const { data: dbInteractions } = await userClient
      .from("drug_interactions")
      .select("drug_a_id, drug_b_id, severity, description, severity_source")
      .in("drug_a_id", allIds)
      .in("drug_b_id", allIds);

    const documentedPairs = new Set<string>();

    for (const inter of dbInteractions ?? []) {
      const nameA = catalogDrugMap.get(inter.drug_a_id) || "Drug A";
      const nameB = catalogDrugMap.get(inter.drug_b_id) || "Drug B";
      const pairKey = [inter.drug_a_id, inter.drug_b_id].sort().join("-");
      documentedPairs.add(pairKey);

      interactions.push({
        drug_a: nameA,
        drug_b: nameB,
        severity: inter.severity || "moderate",
        description: inter.description,
        source: inter.severity_source || "DrugBank Interaction Knowledgebase",
        is_documented: true,
      });
    }

    // Conservative safety handling: for any pair without documented interaction, record unknown status
    for (let i = 0; i < allIds.length; i++) {
      for (let j = i + 1; j < allIds.length; j++) {
        const id1 = allIds[i];
        const id2 = allIds[j];
        const pairKey = [id1, id2].sort().join("-");
        if (!documentedPairs.has(pairKey)) {
          const name1 = catalogDrugMap.get(id1) || "Medicine 1";
          const name2 = catalogDrugMap.get(id2) || "Medicine 2";
          interactions.push({
            drug_a: name1,
            drug_b: name2,
            severity: "unknown",
            description: `No documented interaction found between ${name1} and ${name2} in the verified database. Note: A missing interaction record is NOT proof of safety. Consult a pharmacist or doctor before taking them together.`,
            source: "MedSentry Interaction Database (absence check)",
            is_documented: false,
          });
        }
      }
    }
  }

  return {
    matchedMedicines,
    interactions,
    sources: Array.from(sourcesMap.values()),
    warnings,
    limitations,
  };
}

export function formatKnowledgeSection(knowledge: KnowledgeRetrievalResult): string {
  if (knowledge.matchedMedicines.length === 0 && knowledge.interactions.length === 0) {
    return `=== VERIFIED MEDICATION KNOWLEDGE (INDIA) ===
No specific catalog medicines recognized from the database.
If the user asks about an unlisted medication, explicitly state that its official Indian OTC status is 'unverified' in CDSCO Gazette lists and recommend consulting a licensed pharmacist or doctor.`;
  }

  let text = `=== VERIFIED MEDICATION KNOWLEDGE & FORMULARY (INDIA) ===
The following information is retrieved from authoritative Indian regulatory records (CDSCO, Drugs & Cosmetics Rules 1945, Schedule K, Schedule H/H1, IPC).
Treat this data as ground truth. DO NOT contradict or invent legal classifications, schedules, or contraindications.`;

  for (const m of knowledge.matchedMedicines) {
    text += `\n\n[MEDICINE]: ${m.name}${m.generic_name !== m.name ? ` (Generic: ${m.generic_name})` : ""}`;
    if (m.brand_names?.length) text += `\n- Brand Names in India: ${m.brand_names.join(", ")}`;
    if (m.active_ingredients?.length) text += `\n- Active Ingredients: ${m.active_ingredients.join(" + ")}`;
    if (m.strength) text += `\n- Strength & Form: ${m.strength} (${m.dosage_form || "Formulation"})`;
    text += `\n- Indian Prescription Status: ${m.prescription_status}`;
    text += `\n- Regulatory Schedule: ${m.schedule_category}`;
    text += `\n- Status Verification: ${m.status_verification}`;
    if (m.legal_basis) text += `\n- Legal Basis: ${m.legal_basis}`;
    if (m.source_organization) text += `\n- Source: ${m.source_organization} (${m.source_url || "https://cdsco.gov.in/"})`;
    if (m.aware_class) text += `\n- WHO AWaRe Tier: ${m.aware_class} (Antibiotic stewardship classification — NOT permission for OTC purchase)`;
    if (m.indications) text += `\n- Approved Indications: ${m.indications}`;
    if (m.contraindications) text += `\n- Contraindications: ${m.contraindications}`;
    if (m.precautions) text += `\n- Precautions: ${m.precautions}`;
    if (m.max_otc_dose_adult) text += `\n- Max Adult OTC Dose: ${m.max_otc_dose_adult}`;
  }

  if (knowledge.interactions.length > 0) {
    text += `\n\n=== DRUG INTERACTION FINDINGS ===`;
    for (const it of knowledge.interactions) {
      if (it.is_documented) {
        text += `\n- [KNOWN INTERACTION] ${it.drug_a} + ${it.drug_b}: ${it.description} (Severity: ${it.severity}, Source: ${it.source})`;
      } else {
        text += `\n- [UNKNOWN INTERACTION STATUS] ${it.drug_a} + ${it.drug_b}: ${it.description}`;
      }
    }
  }

  if (knowledge.warnings.length > 0) {
    text += `\n\n=== REGULATORY & CLINICAL WARNINGS ===\n${knowledge.warnings.map((w) => `- ${w}`).join("\n")}`;
  }

  if (knowledge.limitations.length > 0) {
    text += `\n\n=== EVIDENCE LIMITATIONS ===\n${knowledge.limitations.map((l) => `- ${l}`).join("\n")}`;
  }

  return text;
}

export function validateResponseAgainstKnowledge(
  responseText: string,
  knowledge: KnowledgeRetrievalResult | null
): string {
  let validated = responseText;

  // Rule 1: Check if response claims any antibiotic is OTC or non-prescription
  const claimsAntibioticOTC = /(amoxicillin|azithromycin|ciprofloxacin|cefixime|doxycycline|antibiotic).{1,60}(is|as|an)?\s*(otc|over[- ]the[- ]counter|without a prescription|non[- ]prescription)/i.test(validated);
  if (claimsAntibioticOTC) {
    const correction = "\n\n> **MANDATORY STATUTORY SAFETY NOTICE (CDSCO / Drugs & Cosmetics Rules 1945):** Under Indian law and the National Action Plan on Antimicrobial Resistance (NAP-AMR), ALL systemic antibiotics (including Amoxicillin, Azithromycin, Ciprofloxacin, Cefixime, Doxycycline) are strictly **Schedule H or Schedule H1 PRESCRIPTION-ONLY** drugs. They cannot be legally dispensed or taken over-the-counter without a valid doctor's prescription.";
    validated = correction + "\n\n" + validated;
  }

  // Rule 2: Check if unverified medicine was claimed as definitely OTC without caveat
  if (knowledge?.matchedMedicines) {
    for (const med of knowledge.matchedMedicines) {
      if (med.prescription_status === "unverified" || med.status_verification === "unverified") {
        const medRegex = new RegExp(`\\b${med.name}\\b.{1,50}(is|an|safe)\\s*(otc|over[- ]the[- ]counter)`, "i");
        if (medRegex.test(validated) && !validated.toLowerCase().includes("unverified")) {
          validated += `\n\n> **NOTICE ON REGULATORY STATUS:** Official Indian OTC verification for ${med.name} is currently unverified under CDSCO Gazette lists. Please consult a registered pharmacist or physician before use.`;
          break;
        }
      }
    }
  }

  // Ensure unverified limitations from retrieval are attached if not acknowledged
  if (knowledge?.limitations && knowledge.limitations.length > 0) {
    for (const lim of knowledge.limitations) {
      if (!validated.includes(lim) && !validated.toLowerCase().includes("unverified")) {
        validated += `\n\n> **EVIDENCE LIMITATION:** ${lim}`;
      }
    }
  }

  // Rule 3: Check if response claims missing interaction proves safety or interactions are unconfirmed
  const claimsAbsenceIsProof = /(no interactions?|safe together|zero risk|completely safe|100% safe).{1,80}(therefore safe|proves safety|guaranteed safe|zero risk|without worry)/i.test(validated) ||
    /no interactions? (found|in database).{1,60}(so|and) (they are|it is) (completely )?safe/i.test(validated) ||
    /100%\s*safe\s*to\s*combine/i.test(validated);

  const hasUnconfirmedInteraction = knowledge?.interactions?.some((it) => !it.is_documented);
  if ((hasUnconfirmedInteraction || claimsAbsenceIsProof) && !validated.includes("NOT proof of safety")) {
    validated += "\n\n> **SAFETY NOTICE (DRUG INTERACTIONS):** A missing interaction record is NOT proof of safety. Official databases only index established clinical trial reports. Consult a pharmacist or doctor before taking these medications together.";
  }

  return validated;
}

export function buildChatbotSystemPrompt(context: any): string {
  let prompt = `You are MedSentry's AI Health Chatbot — an evidence-based, routine-aware health assistant tailored for users in India.
You have access to the user's health profile, medication list, adherence history, symptom journal, and verified Indian formulary knowledge below.
Use this context to provide personalized, clinically responsible responses.
Never prescribe medications or recommend altering dosages. Always recommend professional consultation for medical decisions.

CRITICAL CLINICAL & REGULATORY GUIDELINES (INDIA):
1. CITATION OF REGULATORY SOURCES: When discussing prescription status, schedules, or contraindications, cite authoritative Indian regulatory sources (e.g., "Per CDSCO / Drugs and Cosmetics Rules 1945, Schedule K Item 23..." or "Under Schedule H / H1...").
2. STRICT ANTIBIOTIC REGULATION: Under Indian law and the National Action Plan on Antimicrobial Resistance (NAP-AMR), ALL systemic antibiotics (e.g., Amoxicillin, Azithromycin, Ciprofloxacin, Cefixime, Doxycycline) are strictly PRESCRIPTION-ONLY (Schedule H or Schedule H1). NEVER describe any antibiotic as over-the-counter (OTC) or suitable for self-treatment.
3. WHO AWARE CLASSIFICATION: WHO AWaRe tiers (Access, Watch, Reserve) are antibiotic stewardship guidelines to prevent antimicrobial resistance; they do NOT indicate OTC status or suitability for self-medication.
4. UNVERIFIED MEDICINES: If a medicine's Indian prescription status is marked as 'unverified', you MUST explicitly state that its official Indian OTC status is unverified under CDSCO Gazette lists, and advise the user to consult a licensed pharmacist or physician. Never assume a drug is OTC because it is OTC in other countries or listed on commercial pharmacy websites.
5. DRUG INTERACTIONS:
   - For documented interactions, clearly explain the mechanism and severity.
   - If no interaction is found between medicines, NEVER claim "they are safe together". Explicitly state that no interaction is documented in the verified database, but a missing record is NOT proof of safety.
6. NO PRESCRIBING DIRECTIVES: Never instruct a user to start, stop, double, or alter prescription medications.
7. RED FLAG SYMPTOMS: If the user mentions emergency warning signs (chest pain, shortness of breath, sudden weakness, severe allergic reaction, high persistent fever in infants), immediately direct them to emergency medical care (dial 112 in India).`;

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
    // Render as a numbered FACT SHEET so the model receives readable names, not opaque UUIDs.
    const factLines = context.activeCourses.map((c: any, i: number) => {
      const name     = c._displayName;
      const dosage   = c.dosage_amount || "";
      const schedule = Array.isArray(c.frequency) ? c.frequency.join(" & ") : (c.frequency || "as directed");
      const instr    = c.instructions ? ` — ${c.instructions}` : "";
      const days     = c.days_remaining != null ? ` — ${c.days_remaining} days remaining` : "";
      const aware    = c.drug?.aware_class ? ` [AWaRe: ${c.drug.aware_class}]` : "";
      return `${i + 1}. ${name}${dosage ? " " + dosage : ""} — ${schedule}${instr}${days}${aware}`;
    });
    prompt += `\n\nActive medications (FACT SHEET — treat this as the only truth about the user's medicines):\n${factLines.join("\n")}`;
  } else {
    prompt += `\n\nActive medications: None recorded.`;
  }

  if (context.symptomJournal?.length > 0) {
    prompt += `\n\nRecent symptom journal entries:\n${JSON.stringify(context.symptomJournal, null, 2)}`;
  } else {
    prompt += `\n\nSymptom journal: No recent entries.`;
  }

  if (context.knowledge) {
    prompt += `\n\n${formatKnowledgeSection(context.knowledge)}`;
  }

  return prompt;
}

// ============================================================================
// Context builders (query DB using user's RLS-scoped client)
// ============================================================================

export async function buildChatbotContext(userClient: any, userId: string, query: string = "") {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // User profile demographics & medical history
  const { data: profile } = await userClient
    .from("profiles")
    .select("full_name, age, weight_kg, height_cm, known_conditions, allergies, preferred_language")
    .eq("id", userId)
    .maybeSingle();

  // Active medication courses — join drugs table for the human-readable name and AWaRe class.
  const { data: rawCourses } = await userClient
    .from("medication_courses")
    .select("id, custom_name, dosage_amount, frequency, instructions, days_remaining, necessity_flag, drug_id, drug:drugs(name, aware_class)")
    .eq("user_id", userId)
    .eq("status", "active");

  const activeCourses = (rawCourses ?? []).map((c: any) => ({
    ...c,
    _displayName: (c.drug?.name ?? c.custom_name ?? "Unknown"),
  }));

  // Dose history — last 7 days.
  const courseIds = activeCourses.map((c: any) => c.id).filter(Boolean);
  let doseHistory: any[] = [];
  if (courseIds.length > 0) {
    const { data: rawDoseHistory } = await userClient
      .from("dose_logs")
      .select("logged_at, status, course_id")
      .in("course_id", courseIds)
      .gte("logged_at", sevenDaysAgo)
      .order("logged_at", { ascending: false })
      .limit(50);
    doseHistory = rawDoseHistory ?? [];
  }

  const totalLogged = doseHistory.length;
  const takenCount = doseHistory.filter((d: any) => d.status === "taken").length;
  const adherenceRate = totalLogged > 0 ? Math.round((takenCount / totalLogged) * 100) : null;
  const adherenceSummary =
    adherenceRate !== null
      ? `${adherenceRate}% adherence (${takenCount}/${totalLogged} doses logged as taken in last 7 days)`
      : courseIds.length === 0
        ? "No active medication courses to compute adherence."
        : "No dose logs recorded in the last 7 days.";

  // Symptom journal — last 7 days
  const { data: symptomJournal } = await userClient
    .from("symptom_journal")
    .select("symptom, severity, status, duration_onset, category_location, created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  // Retrieve validated knowledge & interactions
  const candidateTerms = extractCandidateTerms(query);
  const knowledge = await retrieveKnowledge(userClient, candidateTerms, activeCourses);

  return {
    profile: profile ?? null,
    activeCourses,
    doseHistory,
    adherenceSummary,
    symptomJournal: symptomJournal ?? [],
    knowledge,
  };
}

export async function buildConsultantContext(
  userClient: any,
  userId: string,
  drugName: string | undefined,
  query: string = ""
) {
  let awareClass: string | null = null;
  let drugInfo: any = null;
  let interactions: any[] = [];
  let activeMeds: string[] = [];
  let symptoms: any[] = [];
  let profile: any = null;
  let allergyMatchWarning: string | null = null;
  let knowledge: KnowledgeRetrievalResult | null = null;

  const { data: p } = await userClient
    .from("profiles")
    .select("full_name, age, weight_kg, height_cm, known_conditions, allergies")
    .eq("id", userId)
    .maybeSingle();
  profile = p ?? null;

  // Active courses
  const { data: courses } = await userClient
    .from("medication_courses")
    .select("drug_id, custom_name, drug:drugs(name)")
    .eq("user_id", userId)
    .eq("status", "active");

  const activeCourses = (courses ?? []).map((c: any) => ({
    ...c,
    _displayName: (c.drug?.name ?? c.custom_name ?? "Unknown"),
  }));
  activeMeds = activeCourses.map((c: any) => c._displayName);

  // Look up target drug from drugName or extracted terms from query
  const targetDrugSearch = drugName || query;
  if (targetDrugSearch) {
    const candidates = extractCandidateTerms(targetDrugSearch);
    if (candidates.length > 0 || drugName) {
      const searchTerms = drugName ? [drugName, ...candidates] : candidates;
      knowledge = await retrieveKnowledge(userClient, searchTerms, activeCourses);

      // Prefer matched formulary record or first matched drug
      if (knowledge.matchedMedicines.length > 0) {
        const topMatch = knowledge.matchedMedicines[0];
        awareClass = topMatch.aware_class ?? null;
        drugInfo = topMatch;
      } else if (drugName) {
        // Fallback query directly on drugs table
        const { data: drug } = await userClient
          .from("drugs")
          .select(`
            id, name, generic_name, category, aware_class, common_uses, side_effects, interaction_notes,
            brand_names, active_ingredients, strength, dosage_form, route, indications, contraindications,
            precautions, prescription_status_india, schedule_category_india, status_verification,
            verification_source, source_url, source_version, verification_date, classification_notes
          `)
          .ilike("name", `%${drugName}%`)
          .limit(1)
          .maybeSingle();

        if (drug) {
          awareClass = drug.aware_class;
          drugInfo = {
            ...drug,
            prescription_status: drug.prescription_status_india || "unverified",
            schedule_category: drug.schedule_category_india || "unverified",
            status_verification: drug.status_verification || "unverified",
            source_organization: drug.verification_source,
          };
        }
      }

      if (drugInfo) {
        // Server-side allergy pre-check
        if (profile?.allergies && Array.isArray(profile.allergies) && profile.allergies.length > 0) {
          const drugTargetText = `${drugInfo.name || ""} ${drugInfo.generic_name || ""} ${drugInfo.category || ""} ${drugInfo.aware_class || ""}`.toLowerCase();
          for (const allergy of profile.allergies) {
            const allergyTerm = String(allergy).trim().toLowerCase();
            if (allergyTerm.length >= 3 && drugTargetText.includes(allergyTerm)) {
              allergyMatchWarning = `CRITICAL SAFETY WARNING: The user has a recorded allergy to '${allergy}'. The target drug '${drugInfo.name}' matches this allergy category ('${drugInfo.category || drugInfo.name}'). YOU MUST LEAD YOUR RESPONSE WITH AN EXPLICIT, HIGH-PRIORITY ALLERGY WARNING IN BOLD BEFORE ANY OTHER ANALYSIS.`;
              break;
            }
          }
        }

        interactions = knowledge ? knowledge.interactions : [];
      }
    }
  }

  // Symptom journal context
  const { data: sj } = await userClient
    .from("symptom_journal")
    .select("symptom, severity, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  symptoms = sj ?? [];

  return { profile, awareClass, drugInfo, interactions, activeMeds, activeCourses, symptoms, allergyMatchWarning, knowledge };
}


// ============================================================================
// Parse necessity flag from symptom_to_care AI response
// ============================================================================
export function parseNecessityFlag(responseText: string): NecessityFlag | null {
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

    // Locate the latest user message to attach the image
    let lastUserIdx = -1;
    if (imageBase64) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          lastUserIdx = i;
          break;
        }
      }
    }

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isTargetUser = i === lastUserIdx;
      const parts: any[] = [];
      const textContent = msg.content?.trim();

      if (textContent) {
        parts.push({ text: textContent });
      } else if (isTargetUser) {
        parts.push({ text: "Please inspect this attached medication image and answer my question." });
      } else {
        parts.push({ text: "..." });
      }

      if (isTargetUser && imageBase64) {
        parts.push({ inline_data: { mime_type: imageMime, data: imageBase64 } });
      }

      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      });
    }

    if (imageBase64 && lastUserIdx === -1) {
      contents.push({
        role: "user",
        parts: [
          { text: "Please inspect this attached medication image and answer my question." },
          { inline_data: { mime_type: imageMime, data: imageBase64 } },
        ],
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

export async function handleRequest(req: Request): Promise<Response> {
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
    const query = userContext.query ?? payload.query ?? messages[messages.length - 1]?.content ?? "";

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
    let knowledgeRetrieval: KnowledgeRetrievalResult | null = null;
    let consultantCtx: any = null;
    if (request_type === "chatbot") {
      const ctx = await buildChatbotContext(userClient, userId, query);
      systemPrompt = buildChatbotSystemPrompt(ctx);
      knowledgeRetrieval = ctx.knowledge ?? null;
    } else {
      const ctx = await buildConsultantContext(userClient, userId, userContext.drug_name, query);
      consultantCtx = ctx;
      knowledgeRetrieval = ctx.knowledge ?? null;
      switch (request_type as string) {
        case "suitability":
        case "consultant":
          systemPrompt = buildSuitabilityPrompt(query, ctx, Boolean(image_base64));
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
          systemPrompt = buildSuitabilityPrompt(query, ctx, Boolean(image_base64));
      }
    }

    const formatStructuredRetrieval = (kr: KnowledgeRetrievalResult | null) => {
      if (!kr) return null;
      return {
        medicine_matches: kr.matchedMedicines?.map((m) => ({
          name: m.name,
          generic_name: m.generic_name,
          brand_names: m.brand_names,
          active_ingredients: m.active_ingredients,
          strength: m.strength,
          dosage_form: m.dosage_form,
          prescription_status: m.prescription_status,
          schedule_category: m.schedule_category,
          status_verification: m.status_verification,
          legal_basis: m.legal_basis,
          source_organization: m.source_organization,
          source_url: m.source_url,
          contraindications: m.contraindications,
          precautions: m.precautions,
          max_otc_dose_adult: m.max_otc_dose_adult,
        })),
        interaction_findings: kr.interactions,
        warnings: kr.warnings,
        sources: kr.sources,
        limitations: kr.limitations,
      };
    };

    let structuredRetrieval = formatStructuredRetrieval(knowledgeRetrieval);

    // ── Tier 1: On-device (architectural skip / LiteRT stub) ────────────────
    await logUsage(adminClient, userId, "ondevice", request_type, 0, 0, "skipped");

    // ── Tier 2: Gemini ───────────────────────────────────────────────────────
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (geminiKey) {
      try {
        const res = await callGemini(geminiKey, messages, image_base64, imageMime, systemPrompt);
        await logUsage(adminClient, userId, "gemini", request_type, res.tokens, res.latency, "success");

        // Post-inference knowledge retrieval: if query was image-driven or initial retrieval found no medicines,
        // extract medicines identified by Gemini from the response and perform authoritative catalog lookup.
        let effectiveRetrieval = knowledgeRetrieval;
        if (
          (!effectiveRetrieval || effectiveRetrieval.matchedMedicines.length === 0) &&
          res.response &&
          (image_base64 || request_type === "consultant" || request_type === "visual_id")
        ) {
          const postCandidateTerms = extractCandidateTerms(res.response);
          if (postCandidateTerms.length > 0) {
            const activeCourses = consultantCtx?.activeCourses ?? [];
            const postKnowledge = await retrieveKnowledge(userClient, postCandidateTerms, activeCourses);
            if (postKnowledge.matchedMedicines.length > 0) {
              effectiveRetrieval = postKnowledge;
              structuredRetrieval = formatStructuredRetrieval(effectiveRetrieval);
            }
          }
        }

        // Validate model output against verified regulatory and clinical facts
        const validatedResponse = validateResponseAgainstKnowledge(res.response, effectiveRetrieval);

        // Universal guardrails enforcement across all modes (including prescription_ocr)
        const { safeText, flagged, guardTriggered } = applyGuardrails(query, validatedResponse);
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
          JSON.stringify({
            text: safeText,
            provider: "gemini",
            flagged,
            guardTriggered,
            necessityFlag,
            parsed,
            retrieval: structuredRetrieval,
          }),
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

        const validatedResponse = validateResponseAgainstKnowledge(res.response, knowledgeRetrieval);
        const { safeText, flagged, guardTriggered } = applyGuardrails(query, validatedResponse);
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
            retrieval: structuredRetrieval,
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

        const validatedResponse = validateResponseAgainstKnowledge(res.response, knowledgeRetrieval);
        const { safeText, flagged, guardTriggered } = applyGuardrails(query, validatedResponse);
        if (flagged) {
          await logUsage(adminClient, userId, "guardrail", request_type, 0, 0, guardTriggered ?? "flagged");
        }

        return new Response(
          JSON.stringify({
            text: safeText,
            provider: "openrouter",
            flagged,
            guardTriggered,
            retrieval: structuredRetrieval,
          }),
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
}

if (import.meta.main) {
  serve(handleRequest);
}


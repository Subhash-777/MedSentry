import { supabase } from './supabase';

export type AIRequestType = 'consultant' | 'chatbot' | 'prescription_ocr' | 'visual_id' | 'suitability' | 'symptom_to_care';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RetrievedMedicineSummary {
  name: string;
  generic_name: string;
  brand_names?: string[];
  active_ingredients?: string[];
  strength?: string;
  dosage_form?: string;
  prescription_status: 'OTC' | 'prescription_only' | 'restricted' | 'unverified';
  schedule_category: string;
  status_verification: 'verified_authoritative' | 'provisional_evidence' | 'unverified';
  legal_basis?: string;
  source_organization?: string;
  source_url?: string;
  contraindications?: string;
  precautions?: string;
  max_otc_dose_adult?: string;
}

export interface InteractionFindingSummary {
  drug_a: string;
  drug_b: string;
  severity: string;
  description: string;
  source: string;
  is_documented: boolean;
}

export interface StructuredRetrieval {
  medicine_matches?: RetrievedMedicineSummary[];
  interaction_findings?: InteractionFindingSummary[];
  warnings?: string[];
  sources?: {
    title: string;
    url?: string;
    version?: string;
  }[];
  limitations?: string[];
}

export interface AIResponse {
  text: string;
  provider: string;
  flagged: boolean;
  guardTriggered?: string | null;
  parsed?: any;
  necessityFlag?: string | null;
  retrieval?: StructuredRetrieval | null;
}

export async function invokeAIRouter(
  requestType: AIRequestType,
  messages: AIMessage[],
  imageBase64?: string,
  userContext?: any
): Promise<AIResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-router', {
      body: {
        request_type: requestType,
        messages,
        image_base64: imageBase64,
        userContext,
      },
    });

    if (error) {
      console.error('Edge Function Error:', error);
      throw new Error(error.message || 'AI request failed');
    }

    if (data?.error) {
        throw new Error(data.error);
    }

    return data as AIResponse;
  } catch (err: any) {
    console.error('Invoke Router Error:', err);
    throw new Error(err.message || 'Failed to connect to AI Router');
  }
}

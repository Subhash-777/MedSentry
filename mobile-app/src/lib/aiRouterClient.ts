import { supabase } from './supabase';

export type AIRequestType = 'consultant' | 'chatbot' | 'prescription_ocr' | 'visual_id' | 'suitability' | 'symptom_to_care';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  provider: string;
  flagged: boolean;
  guardTriggered?: string | null;
  parsed?: any;
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

/**
 * MedSentry — TypeScript types matching the live Supabase/Postgres schema.
 *
 * Last synced: 2026-07-27 against live production schema via \d introspection.
 * Tables verified: all 19 public tables + RPCs.
 *
 * When Supabase CLI types generation is available:
 *   npx supabase gen types typescript --local > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ---------------------------------------------------------------------------
// Row types (what Supabase returns from SELECT)
// ---------------------------------------------------------------------------

export type Profile = {
  id: string;
  full_name: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  known_conditions: string[] | null;
  allergies: string[] | null;
  preferred_language: string;
  is_admin: boolean;
  account_type: 'standard' | 'linked_dependent';
  caregiver_consent_revoked: boolean;
  region: string | null;
  created_at: string;
};

export type FamilyGroup = {
  id: string;
  name: string;
  owner_id: string | null;
  invite_code: string | null;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  group_id: string;
  member_id: string;
  role: 'owner' | 'caregiver' | 'viewer';
  is_linked_dependent: boolean;
  joined_at: string;
};

export type Drug = {
  id: string;
  name: string | null;
  generic_name: string | null;
  category: string | null;
  /** WHO AWaRe tier: Access | Watch | Reserve | Not recommended */
  aware_class: string | null;
  common_uses: string | null;
  side_effects: string | null;
  interaction_notes: string | null;
};

export type DrugInteraction = {
  id: string;
  drug_a_id: string | null;
  drug_b_id: string | null;
  /** null when severity_source is 'unclassified' — Phase 3 AI worklist */
  severity: 'mild' | 'moderate' | 'severe' | null;
  /** 'parsed' = heuristic keyword extraction | 'unclassified' = no match found */
  severity_source: 'parsed' | 'unclassified' | null;
  description: string | null;
};

export type Prescription = {
  id: string;
  user_id: string;
  raw_ocr_text: string | null;
  patient_name_extracted: string | null;
  weight_extracted: number | null;
  height_extracted: number | null;
  conditions_extracted: string[] | null;
  doctor_reg_number: string | null;
  prescription_date: string | null;
  scanned_image_url: string | null;
  created_at: string;
};

/** Matches live schema — includes Phase 2 columns added after initial migration */
export type MedicationCourse = {
  id: string;
  user_id: string;
  drug_id: string | null;
  prescription_id: string | null;
  total_pills: number | null;
  daily_dose: number | null;
  start_date: string | null;
  days_remaining: number | null;
  is_antibiotic: boolean;
  necessity_flag: 'valid' | 'flagged_unprescribed' | 'flagged_unnecessary' | null;
  status: 'active' | 'completed' | 'stopped_early';
  created_at: string;
  // Phase 2 additions — verified present in live schema
  expiry_date: string | null;
  batch_number: string | null;
  refill_date: string | null;
  dosage_amount: string | null;
  frequency: string[] | null;
  instructions: string | null;
  custom_name: string | null;
};

export type DoseLog = {
  id: string;
  course_id: string;
  scheduled_time: string | null;
  status: 'taken' | 'skipped' | 'snoozed' | null;
  confirmed_by: string | null;
  logged_at: string;
};

export type MisuseEvent = {
  id: string;
  region: string | null;
  drug_category: string | null;
  event_type: 'unprescribed_purchase' | 'early_stop' | 'unnecessary_use' | null;
  created_at: string;
  course_id: string | null;
};

export type AIConsultation = {
  id: string;
  user_id: string;
  input_text: string | null;
  input_image_url: string | null;
  ai_response: string | null;
  provider_used: string | null;
  flagged_unsafe: boolean;
  created_at: string;
};

export type ChatbotThread = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
};

export type ChatbotMessage = {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string | null;
  provider_used: string | null;
  created_at: string;
};

export type APIUsageLog = {
  id: string;
  provider_name: 'ondevice' | 'gemini' | 'groq' | 'openrouter' | 'huggingface';
  request_type: 'consultant' | 'chatbot' | 'ocr_assist';
  user_id: string | null;
  tokens_estimated: number | null;
  latency_ms: number | null;
  outcome: 'success' | 'rate_limited' | 'error' | 'timeout';
  created_at: string;
};

export type AdminAuditLog = {
  id: string;
  admin_id: string | null;
  action: string;
  target_user_id: string | null;
  details: Json | null;
  created_at: string;
};

export type CaregiverAuditLog = {
  id: string;
  caregiver_id: string;
  target_member_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Json | null;
  created_at: string;
};

export type CabinetInventory = {
  id: string;
  group_id: string;
  drug_id: string | null;
  quantity: number | null;
  expiry_date: string | null;
  added_by: string | null;
  created_at: string;
};

export type SymptomJournal = {
  id: string;
  user_id: string;
  symptom: string | null;
  severity: string | null;
  status: 'ongoing' | 'resolved';
  linked_course_id: string | null;
  created_at: string;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_type: string;
  unlocked_at: string;
  metadata: Json;
};

export type DatasetSyncLog = {
  id: string;
  dataset_name: string;
  status: 'success' | 'failed' | 'in_progress';
  last_refreshed_at: string;
  details: Json | null;
};

// ---------------------------------------------------------------------------
// Database interface (for use with createClient<Database>)
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string | null;
          age?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          known_conditions?: string[] | null;
          allergies?: string[] | null;
          preferred_language?: string;
          is_admin?: boolean;
          account_type?: 'standard' | 'linked_dependent';
          caregiver_consent_revoked?: boolean;
          region?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      family_groups: {
        Row: FamilyGroup;
        Insert: {
          id?: string;
          name: string;
          owner_id?: string | null;
          invite_code?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<FamilyGroup, 'id'>>;
      };
      family_members: {
        Row: FamilyMember;
        Insert: {
          id?: string;
          group_id: string;
          member_id: string;
          role: 'owner' | 'caregiver' | 'viewer';
          is_linked_dependent?: boolean;
          joined_at?: string;
        };
        Update: Partial<Omit<FamilyMember, 'id'>>;
      };
      drugs: {
        Row: Drug;
        Insert: {
          id?: string;
          name?: string | null;
          generic_name?: string | null;
          category?: string | null;
          aware_class?: string | null;
          common_uses?: string | null;
          side_effects?: string | null;
          interaction_notes?: string | null;
        };
        Update: Partial<Omit<Drug, 'id'>>;
      };
      drug_interactions: {
        Row: DrugInteraction;
        Insert: {
          id?: string;
          drug_a_id?: string | null;
          drug_b_id?: string | null;
          severity?: 'mild' | 'moderate' | 'severe' | null;
          severity_source?: 'parsed' | 'unclassified' | null;
          description?: string | null;
        };
        Update: Partial<Omit<DrugInteraction, 'id'>>;
      };
      prescriptions: {
        Row: Prescription;
        Insert: {
          id?: string;
          user_id: string;
          raw_ocr_text?: string | null;
          patient_name_extracted?: string | null;
          weight_extracted?: number | null;
          height_extracted?: number | null;
          conditions_extracted?: string[] | null;
          doctor_reg_number?: string | null;
          prescription_date?: string | null;
          scanned_image_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<Prescription, 'id'>>;
      };
      medication_courses: {
        Row: MedicationCourse;
        Insert: {
          id?: string;
          user_id: string;
          drug_id?: string | null;
          prescription_id?: string | null;
          total_pills?: number | null;
          daily_dose?: number | null;
          start_date?: string | null;
          days_remaining?: number | null;
          is_antibiotic?: boolean;
          necessity_flag?: 'valid' | 'flagged_unprescribed' | 'flagged_unnecessary' | null;
          status?: 'active' | 'completed' | 'stopped_early';
          created_at?: string;
          expiry_date?: string | null;
          batch_number?: string | null;
          refill_date?: string | null;
          dosage_amount?: string | null;
          frequency?: string[] | null;
          instructions?: string | null;
          custom_name?: string | null;
        };
        Update: Partial<Omit<MedicationCourse, 'id'>>;
      };
      dose_logs: {
        Row: DoseLog;
        Insert: {
          id?: string;
          course_id: string;
          scheduled_time?: string | null;
          status?: 'taken' | 'skipped' | 'snoozed' | null;
          confirmed_by?: string | null;
          logged_at?: string;
        };
        Update: Partial<Omit<DoseLog, 'id'>>;
      };
      misuse_events: {
        Row: MisuseEvent;
        Insert: {
          id?: string;
          region?: string | null;
          drug_category?: string | null;
          event_type?: 'unprescribed_purchase' | 'early_stop' | 'unnecessary_use' | null;
          created_at?: string;
          course_id?: string | null;
        };
        Update: Partial<Omit<MisuseEvent, 'id'>>;
      };
      ai_consultations: {
        Row: AIConsultation;
        Insert: {
          id?: string;
          user_id: string;
          input_text?: string | null;
          input_image_url?: string | null;
          ai_response?: string | null;
          provider_used?: string | null;
          flagged_unsafe?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<AIConsultation, 'id'>>;
      };
      chatbot_threads: {
        Row: ChatbotThread;
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<ChatbotThread, 'id'>>;
      };
      chatbot_messages: {
        Row: ChatbotMessage;
        Insert: {
          id?: string;
          thread_id: string;
          role: 'user' | 'assistant';
          content?: string | null;
          provider_used?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<ChatbotMessage, 'id'>>;
      };
      api_usage_logs: {
        Row: APIUsageLog;
        Insert: {
          id?: string;
          provider_name: 'ondevice' | 'gemini' | 'groq' | 'openrouter' | 'huggingface';
          request_type: 'consultant' | 'chatbot' | 'ocr_assist';
          user_id?: string | null;
          tokens_estimated?: number | null;
          latency_ms?: number | null;
          outcome: 'success' | 'rate_limited' | 'error' | 'timeout';
          created_at?: string;
        };
        Update: Partial<Omit<APIUsageLog, 'id'>>;
      };
      admin_audit_log: {
        Row: AdminAuditLog;
        Insert: {
          id?: string;
          admin_id?: string | null;
          action: string;
          target_user_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: Partial<Omit<AdminAuditLog, 'id'>>;
      };
      caregiver_audit_log: {
        Row: CaregiverAuditLog;
        Insert: {
          id?: string;
          caregiver_id: string;
          target_member_id: string;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: Partial<Omit<CaregiverAuditLog, 'id'>>;
      };
      cabinet_inventory: {
        Row: CabinetInventory;
        Insert: {
          id?: string;
          group_id: string;
          drug_id?: string | null;
          quantity?: number | null;
          expiry_date?: string | null;
          added_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<CabinetInventory, 'id'>>;
      };
      symptom_journal: {
        Row: SymptomJournal;
        Insert: {
          id?: string;
          user_id: string;
          symptom?: string | null;
          severity?: string | null;
          status?: 'ongoing' | 'resolved';
          linked_course_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Omit<SymptomJournal, 'id'>>;
      };
      user_badges: {
        Row: UserBadge;
        Insert: {
          id?: string;
          user_id: string;
          badge_type: string;
          unlocked_at?: string;
          metadata?: Json;
        };
        Update: Partial<Omit<UserBadge, 'id'>>;
      };
      dataset_sync_log: {
        Row: DatasetSyncLog;
        Insert: {
          id?: string;
          dataset_name: string;
          status: 'success' | 'failed' | 'in_progress';
          last_refreshed_at?: string;
          details?: Json | null;
        };
        Update: Partial<Omit<DatasetSyncLog, 'id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_family_circle: {
        Args: { invite_code: string; is_linked_dependent?: boolean };
        Returns: void;
      };
      get_amr_heatmap: {
        Args: Record<string, never>;
        Returns: Array<{
          region: string | null;
          drug_category: string | null;
          event_type: string | null;
          total_30d_count: number;
          is_elevated: boolean;
        }>;
      };
      is_circle_member: {
        Args: { group_id: string; user_id: string };
        Returns: boolean;
      };
      evaluate_and_award_badges: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
};

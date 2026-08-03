export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          city: string
          created_at: string
          id: string
          label: string
          state_code: string
          state_name: string
          top100: boolean
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          label: string
          state_code: string
          state_name: string
          top100?: boolean
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          label?: string
          state_code?: string
          state_name?: string
          top100?: boolean
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          channel: Database["public"]["Enums"]["consent_channel"]
          created_at: string
          granted: boolean
          id: string
          source: string
          user_id: string
          wording: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["consent_channel"]
          created_at?: string
          granted: boolean
          id?: string
          source: string
          user_id: string
          wording: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["consent_channel"]
          created_at?: string
          granted?: boolean
          id?: string
          source?: string
          user_id?: string
          wording?: string
        }
        Relationships: []
      }
      job_sources: {
        Row: {
          ats: string
          company_domain: string | null
          company_name: string
          company_sector: string | null
          created_at: string
          enabled: boolean
          handle: string
          id: string
          last_error: string | null
          last_synced_at: string | null
          updated_at: string
        }
        Insert: {
          ats: string
          company_domain?: string | null
          company_name: string
          company_sector?: string | null
          created_at?: string
          enabled?: boolean
          handle: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
        Update: {
          ats?: string
          company_domain?: string | null
          company_name?: string
          company_sector?: string | null
          created_at?: string
          enabled?: boolean
          handle?: string
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company: string
          company_domain: string | null
          company_sector: string | null
          description: string | null
          group_name: string
          hard_skills: Json
          id: string
          location: string
          min_years_experience: number
          posted_days_ago: number
          role_ids: Json
          roles: Json
          salary_max: number | null
          salary_min: number | null
          seniority: string
          soft_skills: Json
          source: string | null
          stack: Json
          title: string
          tools: Json
          work_mode: string
        }
        Insert: {
          company: string
          company_domain?: string | null
          company_sector?: string | null
          description?: string | null
          group_name: string
          hard_skills?: Json
          id: string
          location: string
          min_years_experience?: number
          posted_days_ago?: number
          role_ids?: Json
          roles?: Json
          salary_max?: number | null
          salary_min?: number | null
          seniority: string
          soft_skills?: Json
          source?: string | null
          stack?: Json
          title: string
          tools?: Json
          work_mode: string
        }
        Update: {
          company?: string
          company_domain?: string | null
          company_sector?: string | null
          description?: string | null
          group_name?: string
          hard_skills?: Json
          id?: string
          location?: string
          min_years_experience?: number
          posted_days_ago?: number
          role_ids?: Json
          roles?: Json
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string
          soft_skills?: Json
          source?: string | null
          stack?: Json
          title?: string
          tools?: Json
          work_mode?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      resume_documents: {
        Row: {
          checksum_sha256: string | null
          created_at: string
          deleted_at: string | null
          file_path: string
          id: string
          is_primary: boolean
          mime_type: string
          original_filename: string
          parse_status: string
          parsed_at: string | null
          size_bytes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          checksum_sha256?: string | null
          created_at?: string
          deleted_at?: string | null
          file_path: string
          id?: string
          is_primary?: boolean
          mime_type: string
          original_filename: string
          parse_status?: string
          parsed_at?: string | null
          size_bytes: number
          updated_at?: string
          user_id: string
        }
        Update: {
          checksum_sha256?: string | null
          created_at?: string
          deleted_at?: string | null
          file_path?: string
          id?: string
          is_primary?: boolean
          mime_type?: string
          original_filename?: string
          parse_status?: string
          parsed_at?: string | null
          size_bytes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          pause_ends_at: string | null
          paused_at: string | null
          plan: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          pause_ends_at?: string | null
          paused_at?: string | null
          plan?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          pause_ends_at?: string | null
          paused_at?: string | null
          plan?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_job_state: {
        Row: {
          applied_at: string | null
          applied_cover_letter_name: string | null
          applied_resume_name: string | null
          archived: boolean
          column_id: string | null
          created_at: string
          history: Json
          interview_at: string | null
          interview_stage: string | null
          job_id: string
          last_status: Database["public"]["Enums"]["job_status"] | null
          moved_at: string | null
          notes: string
          offer_at: string | null
          offer_details: string | null
          offer_status: string | null
          rejection_at: string | null
          rejection_details: string | null
          reminder_at: string | null
          saved_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          applied_cover_letter_name?: string | null
          applied_resume_name?: string | null
          archived?: boolean
          column_id?: string | null
          created_at?: string
          history?: Json
          interview_at?: string | null
          interview_stage?: string | null
          job_id: string
          last_status?: Database["public"]["Enums"]["job_status"] | null
          moved_at?: string | null
          notes?: string
          offer_at?: string | null
          offer_details?: string | null
          offer_status?: string | null
          rejection_at?: string | null
          rejection_details?: string | null
          reminder_at?: string | null
          saved_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          applied_cover_letter_name?: string | null
          applied_resume_name?: string | null
          archived?: boolean
          column_id?: string | null
          created_at?: string
          history?: Json
          interview_at?: string | null
          interview_stage?: string | null
          job_id?: string
          last_status?: Database["public"]["Enums"]["job_status"] | null
          moved_at?: string | null
          notes?: string
          offer_at?: string | null
          offer_details?: string | null
          offer_status?: string | null
          rejection_at?: string | null
          rejection_details?: string | null
          reminder_at?: string | null
          saved_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_job_state_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_entitlements: { Args: never; Returns: Json }
      has_pro: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      consent_channel:
        | "resume_storage"
        | "daily_digest"
        | "product_updates"
        | "marketing"
      job_status:
        | "default"
        | "saved"
        | "applied"
        | "interview"
        | "offer"
        | "rejection"
        | "dismissed"
        | "reported"
        | "interview_screen"
        | "interview_tech"
        | "test_task"
      subscription_status:
        | "none"
        | "trialing"
        | "active"
        | "past_due"
        | "paused"
        | "canceled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      consent_channel: [
        "resume_storage",
        "daily_digest",
        "product_updates",
        "marketing",
      ],
      job_status: [
        "default",
        "saved",
        "applied",
        "interview",
        "offer",
        "rejection",
        "dismissed",
        "reported",
        "interview_screen",
        "interview_tech",
        "test_task",
      ],
      subscription_status: [
        "none",
        "trialing",
        "active",
        "past_due",
        "paused",
        "canceled",
      ],
    },
  },
} as const

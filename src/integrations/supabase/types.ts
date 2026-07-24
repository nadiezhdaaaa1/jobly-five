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
      jobs: {
        Row: {
          company: string | null
          company_domain: string | null
          company_sector: string | null
          created_at: string
          english_level: string | null
          group: string | null
          hard_skills: string[]
          id: string
          location: string | null
          min_years_experience: number | null
          posted_days_ago: number | null
          role_ids: string[]
          roles: string[]
          salary_max: number | null
          salary_min: number | null
          seniority: string | null
          soft_skills: string[]
          source: string | null
          stack: string[]
          title: string
          tools: string[]
          work_mode: string | null
        }
        Insert: {
          company?: string | null
          company_domain?: string | null
          company_sector?: string | null
          created_at?: string
          english_level?: string | null
          group?: string | null
          hard_skills?: string[]
          id: string
          location?: string | null
          min_years_experience?: number | null
          posted_days_ago?: number | null
          role_ids?: string[]
          roles?: string[]
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          soft_skills?: string[]
          source?: string | null
          stack?: string[]
          title: string
          tools?: string[]
          work_mode?: string | null
        }
        Update: {
          company?: string | null
          company_domain?: string | null
          company_sector?: string | null
          created_at?: string
          english_level?: string | null
          group?: string | null
          hard_skills?: string[]
          id?: string
          location?: string | null
          min_years_experience?: number | null
          posted_days_ago?: number | null
          role_ids?: string[]
          roles?: string[]
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          soft_skills?: string[]
          source?: string | null
          stack?: string[]
          title?: string
          tools?: string[]
          work_mode?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_job_state: {
        Row: {
          applied_at: string | null
          applied_cover_letter_name: string | null
          applied_resume_name: string | null
          archived: boolean
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
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      job_status:
        | "default"
        | "saved"
        | "applied"
        | "interview"
        | "offer"
        | "rejection"
        | "dismissed"
        | "reported"
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
      job_status: [
        "default",
        "saved",
        "applied",
        "interview",
        "offer",
        "rejection",
        "dismissed",
        "reported",
      ],
    },
  },
} as const

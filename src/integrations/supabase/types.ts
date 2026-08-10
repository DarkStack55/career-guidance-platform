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
      assessment_results: {
        Row: {
          created_at: string
          details: Json
          id: string
          kind: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          kind: string
          score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_usage: {
        Row: {
          count: number
          day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      gap_plan_shares: {
        Row: {
          candidate_name: string | null
          created_at: string
          id: string
          pdf_path: string | null
          plan: Json
          target_role: string
          user_id: string
        }
        Insert: {
          candidate_name?: string | null
          created_at?: string
          id?: string
          pdf_path?: string | null
          plan: Json
          target_role: string
          user_id: string
        }
        Update: {
          candidate_name?: string | null
          created_at?: string
          id?: string
          pdf_path?: string | null
          plan?: Json
          target_role?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          audio_path: string | null
          confidence_avg: number
          created_at: string
          debrief: Json | null
          duration_sec: number
          ended_at: string | null
          error_message: string | null
          eye_contact_avg: number
          highlights: string
          id: string
          level: string
          question_budget: number
          role: string
          started_at: string | null
          status: string
          track: string
          updated_at: string
          user_id: string
          voice: string
        }
        Insert: {
          audio_path?: string | null
          confidence_avg?: number
          created_at?: string
          debrief?: Json | null
          duration_sec?: number
          ended_at?: string | null
          error_message?: string | null
          eye_contact_avg?: number
          highlights?: string
          id?: string
          level?: string
          question_budget?: number
          role?: string
          started_at?: string | null
          status?: string
          track?: string
          updated_at?: string
          user_id: string
          voice?: string
        }
        Update: {
          audio_path?: string | null
          confidence_avg?: number
          created_at?: string
          debrief?: Json | null
          duration_sec?: number
          ended_at?: string | null
          error_message?: string | null
          eye_contact_avg?: number
          highlights?: string
          id?: string
          level?: string
          question_budget?: number
          role?: string
          started_at?: string | null
          status?: string
          track?: string
          updated_at?: string
          user_id?: string
          voice?: string
        }
        Relationships: []
      }
      job_alert_preferences: {
        Row: {
          arrangements: string[]
          created_at: string
          employment_types: string[]
          enabled: boolean
          experience_levels: string[]
          frequency: string
          industries: string[]
          min_salary: number
          updated_at: string
          user_id: string
        }
        Insert: {
          arrangements?: string[]
          created_at?: string
          employment_types?: string[]
          enabled?: boolean
          experience_levels?: string[]
          frequency?: string
          industries?: string[]
          min_salary?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          arrangements?: string[]
          created_at?: string
          employment_types?: string[]
          enabled?: boolean
          experience_levels?: string[]
          frequency?: string
          industries?: string[]
          min_salary?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          company: string
          cover_note: string | null
          created_at: string
          id: string
          job_id: string
          job_title: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company: string
          cover_note?: string | null
          created_at?: string
          id?: string
          job_id: string
          job_title: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string
          cover_note?: string | null
          created_at?: string
          id?: string
          job_id?: string
          job_title?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      magic_link_requests: {
        Row: {
          created_at: string
          email: string
          id: number
          ip: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          ip?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          ip?: string | null
        }
        Relationships: []
      }
      otp_challenges: {
        Row: {
          attempts: number
          email: string
          issued_at: string
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          email: string
          issued_at?: string
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          email?: string
          issued_at?: string
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          headline: string | null
          id: string
          location: string | null
          phone: string | null
          preferred_voice: string | null
          resume_url: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id: string
          location?: string | null
          phone?: string | null
          preferred_voice?: string | null
          resume_url?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          preferred_voice?: string | null
          resume_url?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      resume_analyses: {
        Row: {
          ats_score: number
          created_at: string
          file_name: string
          file_path: string
          id: string
          overall_score: number
          sections: Json
          strengths: Json
          suggested_roles: Json
          suggestions: Json
          summary: string | null
          user_id: string
          weaknesses: Json
        }
        Insert: {
          ats_score?: number
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          overall_score?: number
          sections?: Json
          strengths?: Json
          suggested_roles?: Json
          suggestions?: Json
          summary?: string | null
          user_id: string
          weaknesses?: Json
        }
        Update: {
          ats_score?: number
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          overall_score?: number
          sections?: Json
          strengths?: Json
          suggested_roles?: Json
          suggestions?: Json
          summary?: string | null
          user_id?: string
          weaknesses?: Json
        }
        Relationships: []
      }
      resume_versions: {
        Row: {
          created_at: string
          draft: Json
          id: string
          label: string
          source: string
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          draft?: Json
          id?: string
          label?: string
          source?: string
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          created_at?: string
          draft?: Json
          id?: string
          label?: string
          source?: string
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      saved_careers: {
        Row: {
          career_slug: string
          created_at: string
          id: string
          industry: string | null
          notes: string | null
          title: string
          user_id: string
        }
        Insert: {
          career_slug: string
          created_at?: string
          id?: string
          industry?: string | null
          notes?: string | null
          title: string
          user_id: string
        }
        Update: {
          career_slug?: string
          created_at?: string
          id?: string
          industry?: string | null
          notes?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      transcript_turns: {
        Row: {
          created_at: string
          id: string
          metrics: Json | null
          session_id: string
          speaker: string
          spoken_at: string
          text: string
          turn_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metrics?: Json | null
          session_id: string
          speaker: string
          spoken_at?: string
          text?: string
          turn_index?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json | null
          session_id?: string
          speaker?: string
          spoken_at?: string
          text?: string
          turn_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const

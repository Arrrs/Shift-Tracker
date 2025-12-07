export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      currency_rates: {
        Row: {
          from_currency: string
          id: string
          rate: number
          to_currency: string
          updated_at: string | null
        }
        Insert: {
          from_currency: string
          id?: string
          rate: number
          to_currency: string
          updated_at?: string | null
        }
        Update: {
          from_currency?: string
          id?: string
          rate?: number
          to_currency?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          color: string | null
          created_at: string | null
          currency: string | null
          currency_symbol: string | null
          daily_rate: number | null
          description: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          overtime_config: Json | null
          pay_type: string | null
          personal_days_per_year: number | null
          pto_days_per_year: number | null
          sick_days_per_year: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          daily_rate?: number | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          overtime_config?: Json | null
          pay_type?: string | null
          personal_days_per_year?: number | null
          pto_days_per_year?: number | null
          sick_days_per_year?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          daily_rate?: number | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          overtime_config?: Json | null
          pay_type?: string | null
          personal_days_per_year?: number | null
          pto_days_per_year?: number | null
          sick_days_per_year?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      salary_periods: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          name: string | null
          start_date: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          name?: string | null
          start_date: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string | null
          start_date?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shift_adjustments: {
        Row: {
          amount: number
          calculation_type: string | null
          created_at: string | null
          description: string
          id: string
          percentage_of: string | null
          shift_id: string
          type: string
        }
        Insert: {
          amount: number
          calculation_type?: string | null
          created_at?: string | null
          description: string
          id?: string
          percentage_of?: string | null
          shift_id: string
          type: string
        }
        Update: {
          amount?: number
          calculation_type?: string | null
          created_at?: string | null
          description?: string
          id?: string
          percentage_of?: string | null
          shift_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_adjustments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          color: string | null
          created_at: string | null
          end_time: string
          expected_hours: number
          id: string
          job_id: string
          name: string
          short_code: string | null
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          end_time: string
          expected_hours: number
          id?: string
          job_id: string
          name: string
          short_code?: string | null
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          end_time?: string
          expected_hours?: number
          id?: string
          job_id?: string
          name?: string
          short_code?: string | null
          start_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_templates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          actual_hours: number | null
          created_at: string | null
          date: string
          end_time: string | null
          holiday_multiplier: number | null
          id: string
          is_holiday: boolean | null
          is_overnight: boolean | null
          job_id: string | null
          notes: string | null
          overtime_hours: number | null
          regular_hours: number | null
          scheduled_hours: number | null
          start_time: string
          status: string | null
          template_id: string | null
          undertime_hours: number | null
          updated_at: string | null
          user_id: string
          variance_hours: number | null
        }
        Insert: {
          actual_hours?: number | null
          created_at?: string | null
          date: string
          end_time?: string | null
          holiday_multiplier?: number | null
          id?: string
          is_holiday?: boolean | null
          is_overnight?: boolean | null
          job_id?: string | null
          notes?: string | null
          overtime_hours?: number | null
          regular_hours?: number | null
          scheduled_hours?: number | null
          start_time: string
          status?: string | null
          template_id?: string | null
          undertime_hours?: number | null
          updated_at?: string | null
          user_id: string
          variance_hours?: number | null
        }
        Update: {
          actual_hours?: number | null
          created_at?: string | null
          date?: string
          end_time?: string | null
          holiday_multiplier?: number | null
          id?: string
          is_holiday?: boolean | null
          is_overnight?: boolean | null
          job_id?: string | null
          notes?: string | null
          overtime_hours?: number | null
          regular_hours?: number | null
          scheduled_hours?: number | null
          start_time?: string
          status?: string | null
          template_id?: string | null
          undertime_hours?: number | null
          updated_at?: string | null
          user_id?: string
          variance_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off_records: {
        Row: {
          created_at: string | null
          date: string
          hours_credited: number | null
          id: string
          is_paid: boolean | null
          job_id: string | null
          notes: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          hours_credited?: number | null
          id?: string
          is_paid?: boolean | null
          job_id?: string | null
          notes?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          hours_credited?: number | null
          id?: string
          is_paid?: boolean | null
          job_id?: string | null
          notes?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_records_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_convert_currency: boolean | null
          clock_style: string | null
          created_at: string | null
          dashboard_layout: Json | null
          default_currency: string | null
          id: string
          language: string | null
          notification_prefs: Json | null
          primary_currency: string | null
          show_currency_breakdown: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_convert_currency?: boolean | null
          clock_style?: string | null
          created_at?: string | null
          dashboard_layout?: Json | null
          default_currency?: string | null
          id?: string
          language?: string | null
          notification_prefs?: Json | null
          primary_currency?: string | null
          show_currency_breakdown?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_convert_currency?: boolean | null
          clock_style?: string | null
          created_at?: string | null
          dashboard_layout?: Json | null
          default_currency?: string | null
          id?: string
          language?: string | null
          notification_prefs?: Json | null
          primary_currency?: string | null
          show_currency_breakdown?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_scheduled_hours: {
        Args: {
          p_end_time: string
          p_is_overnight?: boolean
          p_start_time: string
        }
        Returns: number
      }
      get_pto_balance: {
        Args: { p_job_id: string; p_user_id: string; p_year?: number }
        Returns: {
          personal_remaining: number
          personal_total: number
          personal_used: number
          sick_remaining: number
          sick_total: number
          sick_used: number
          vacation_remaining: number
          vacation_total: number
          vacation_used: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const


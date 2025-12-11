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
    PostgrestVersion: "13.0.5"
  }
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
      expense_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_records: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          currency: string
          date: string
          description: string | null
          id: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          currency?: string
          date: string
          description?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          currency?: string
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_records_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_records: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          currency: string
          date: string
          description: string
          id: string
          job_id: string | null
          notes: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          currency?: string
          date: string
          description: string
          id?: string
          job_id?: string | null
          notes?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          currency?: string
          date?: string
          description?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      income_records: {
        Row: {
          amount: number
          calculation_basis: Json | null
          created_at: string | null
          currency: string
          date: string
          id: string
          is_manual: boolean | null
          job_id: string | null
          notes: string | null
          source_type: string
          time_entry_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          calculation_basis?: Json | null
          created_at?: string | null
          currency?: string
          date: string
          id?: string
          is_manual?: boolean | null
          job_id?: string | null
          notes?: string | null
          source_type: string
          time_entry_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          calculation_basis?: Json | null
          created_at?: string | null
          currency?: string
          date?: string
          id?: string
          is_manual?: boolean | null
          job_id?: string | null
          notes?: string | null
          source_type?: string
          time_entry_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_records_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_records_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
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
          monthly_salary: number | null
          name: string
          pay_type: string
          personal_days_per_year: number | null
          pto_days_per_year: number | null
          salary_history: Json | null
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
          monthly_salary?: number | null
          name: string
          pay_type: string
          personal_days_per_year?: number | null
          pto_days_per_year?: number | null
          salary_history?: Json | null
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
          monthly_salary?: number | null
          name?: string
          pay_type?: string
          personal_days_per_year?: number | null
          pto_days_per_year?: number | null
          salary_history?: Json | null
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
        Relationships: []
      }
      shift_templates: {
        Row: {
          color: string | null
          created_at: string | null
          default_custom_rate: number | null
          default_holiday_multiplier: number | null
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
          default_custom_rate?: number | null
          default_holiday_multiplier?: number | null
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
          default_custom_rate?: number | null
          default_holiday_multiplier?: number | null
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
      time_entries: {
        Row: {
          actual_hours: number
          created_at: string | null
          custom_currency: string | null
          custom_daily_rate: number | null
          custom_hourly_rate: number | null
          date: string
          day_off_type: string | null
          end_time: string | null
          entry_type: string
          holiday_fixed_amount: number | null
          holiday_multiplier: number | null
          id: string
          is_full_day: boolean | null
          is_holiday: boolean | null
          is_overnight: boolean | null
          job_id: string | null
          notes: string | null
          pay_override_type: string | null
          scheduled_hours: number | null
          start_time: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_hours: number
          created_at?: string | null
          custom_currency?: string | null
          custom_daily_rate?: number | null
          custom_hourly_rate?: number | null
          date: string
          day_off_type?: string | null
          end_time?: string | null
          entry_type: string
          holiday_fixed_amount?: number | null
          holiday_multiplier?: number | null
          id?: string
          is_full_day?: boolean | null
          is_holiday?: boolean | null
          is_overnight?: boolean | null
          job_id?: string | null
          notes?: string | null
          pay_override_type?: string | null
          scheduled_hours?: number | null
          start_time?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_hours?: number
          created_at?: string | null
          custom_currency?: string | null
          custom_daily_rate?: number | null
          custom_hourly_rate?: number | null
          date?: string
          day_off_type?: string | null
          end_time?: string | null
          entry_type?: string
          holiday_fixed_amount?: number | null
          holiday_multiplier?: number | null
          id?: string
          is_full_day?: boolean | null
          is_holiday?: boolean | null
          is_overnight?: boolean | null
          job_id?: string | null
          notes?: string | null
          pay_override_type?: string | null
          scheduled_hours?: number | null
          start_time?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_template_id_fkey"
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
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          default_calendar_view: string | null
          id: string
          show_expense_card: boolean | null
          show_expense_records: boolean | null
          show_financial_records: boolean | null
          show_fixed_income_card: boolean | null
          show_income_records: boolean | null
          show_other_income_card: boolean | null
          show_shift_income_card: boolean | null
          show_shifts: boolean | null
          show_time_off: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_calendar_view?: string | null
          id?: string
          show_expense_card?: boolean | null
          show_expense_records?: boolean | null
          show_financial_records?: boolean | null
          show_fixed_income_card?: boolean | null
          show_income_records?: boolean | null
          show_other_income_card?: boolean | null
          show_shift_income_card?: boolean | null
          show_shifts?: boolean | null
          show_time_off?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_calendar_view?: string | null
          id?: string
          show_expense_card?: boolean | null
          show_expense_records?: boolean | null
          show_financial_records?: boolean | null
          show_fixed_income_card?: boolean | null
          show_income_records?: boolean | null
          show_other_income_card?: boolean | null
          show_shift_income_card?: boolean | null
          show_shifts?: boolean | null
          show_time_off?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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

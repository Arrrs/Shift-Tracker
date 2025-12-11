"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return { user, supabase };
}

// ============================================
// GET TIME ENTRIES
// ============================================

export async function getTimeEntries(startDate: string, endDate: string) {
  const { user, supabase } = await getAuthenticatedUser();

  const { data: entries, error } = await supabase
    .from("time_entries")
    .select(
      `
      *,
      jobs (
        id,
        name,
        color,
        pay_type,
        hourly_rate,
        daily_rate,
        currency,
        currency_symbol
      ),
      shift_templates (
        id,
        name,
        short_code
      )
    `
    )
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return { error: error.message, entries: null };
  }

  return { entries, error: null };
}

// ============================================
// CREATE TIME ENTRY
// ============================================

type CreateTimeEntryData =
  | {
      entry_type: "work_shift";
      job_id: string | null;
      template_id?: string | null;
      date: string;
      start_time: string;
      end_time: string;
      scheduled_hours: number;
      actual_hours: number;
      is_overnight?: boolean;
      // Pay customization fields
      pay_override_type?: string | null;
      custom_hourly_rate?: number | null;
      custom_daily_rate?: number | null;
      is_holiday?: boolean;
      holiday_multiplier?: number | null;
      holiday_fixed_amount?: number | null;
      status?: string;
      notes?: string;
    }
  | {
      entry_type: "day_off";
      job_id?: string | null;
      date: string;
      day_off_type: string;
      actual_hours: number;
      is_full_day: boolean;
      status?: string;
      notes?: string;
    };

export async function createTimeEntry(data: CreateTimeEntryData) {
  const { user, supabase } = await getAuthenticatedUser();

  const { data: entry, error } = await supabase
    .from("time_entries")
    .insert({
      ...data,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message, entry: null };
  }

  revalidatePath("/calendar");
  return { entry, error: null };
}

// ============================================
// UPDATE TIME ENTRY
// ============================================

export async function updateTimeEntry(id: string, data: Partial<CreateTimeEntryData>) {
  const { user, supabase } = await getAuthenticatedUser();

  const { data: entry, error } = await supabase
    .from("time_entries")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message, entry: null };
  }

  revalidatePath("/calendar");
  return { entry, error: null };
}

// ============================================
// DELETE TIME ENTRY
// ============================================

export async function deleteTimeEntry(id: string) {
  const { user, supabase } = await getAuthenticatedUser();

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/calendar");
  return { error: null };
}

// ============================================
// GET SHIFT TEMPLATES
// ============================================

export async function getShiftTemplates(jobId: string) {
  const { user, supabase } = await getAuthenticatedUser();

  const { data: templates, error } = await supabase
    .from("shift_templates")
    .select("*")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .order("name", { ascending: true });

  if (error) {
    return { error: error.message, templates: null };
  }

  return { templates, error: null };
}

// ============================================
// GET INCOME RECORDS
// ============================================

export async function getIncomeRecords(startDate: string, endDate: string) {
  const { user, supabase } = await getAuthenticatedUser();

  const { data: records, error } = await supabase
    .from("income_records")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    return { error: error.message, records: null };
  }

  return { records, error: null };
}

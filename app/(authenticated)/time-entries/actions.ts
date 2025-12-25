"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createTimeEntrySchema, updateTimeEntrySchema } from "@/lib/validations";
import { formatZodError } from "@/lib/utils/validation-errors";

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

export async function createTimeEntry(data: unknown) {
  try {
    // Validate input data
    const validated = createTimeEntrySchema.parse(data);

    const { user, supabase } = await getAuthenticatedUser();

    const { data: entry, error } = await supabase
      .from("time_entries")
      .insert({
        ...validated,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message, entry: null };
    }

    revalidatePath("/calendar");
    revalidatePath("/countdown");
    return { entry, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: formatZodError(error), entry: null };
    }
    return { error: "Invalid input data", entry: null };
  }
}

// ============================================
// UPDATE TIME ENTRY
// ============================================

export async function updateTimeEntry(id: string, data: unknown) {
  try {
    // Validate input data
    const validated = updateTimeEntrySchema.parse(data);

    const { user, supabase } = await getAuthenticatedUser();

    const { data: entry, error } = await supabase
      .from("time_entries")
      .update(validated)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { error: error.message, entry: null };
    }

    revalidatePath("/calendar");
    revalidatePath("/countdown");
    return { entry, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: formatZodError(error), entry: null };
    }
    return { error: "Invalid input data", entry: null };
  }
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
  revalidatePath("/countdown");
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

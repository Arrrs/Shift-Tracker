"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CountdownSettings } from "./types";

export async function startShiftNow(data: {
  jobId: string;
  templateId?: string | null;
  startTime?: string;
  endTime?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // If template provided, get its details
    let scheduled_hours = 8;
    let start_time = data.startTime || now.toTimeString().slice(0, 5);
    let end_time = data.endTime;

    if (data.templateId) {
      const { data: template } = await supabase
        .from('shift_templates')
        .select('*')
        .eq('id', data.templateId)
        .single();

      if (template) {
        scheduled_hours = template.expected_hours;
        start_time = data.startTime || template.start_time;
        end_time = data.endTime || template.end_time;
      }
    }

    // If no end time, calculate it
    if (!end_time) {
      const endDate = new Date(now);
      endDate.setHours(endDate.getHours() + scheduled_hours);
      end_time = endDate.toTimeString().slice(0, 5);
    }

    // Create time entry
    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        job_id: data.jobId,
        template_id: data.templateId || null,
        date: today,
        start_time,
        end_time,
        scheduled_hours,
        actual_hours: 0,
        entry_type: 'shift',
        status: 'in_progress',
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/countdown');
    revalidatePath('/calendar');

    return { success: true, data: entry };
  } catch (error) {
    console.error('Error starting shift:', error);
    return { error: error instanceof Error ? error.message : 'Failed to start shift' };
  }
}

export async function completeShift(data: {
  entryId: string;
  actualHours?: number;
  useTemplateHours?: boolean;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Get the entry
    const { data: entry, error: fetchError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('id', data.entryId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;
    if (!entry) return { error: 'Entry not found' };

    let actualHours = data.actualHours;

    // Calculate actual hours if not provided
    if (actualHours === undefined) {
      if (data.useTemplateHours) {
        actualHours = entry.scheduled_hours || 8;
      } else {
        // Calculate from start/end time
        if (entry.start_time && entry.end_time) {
          const start = new Date();
          const [startHour, startMin] = entry.start_time.split(':').map(Number);
          start.setHours(startHour, startMin, 0, 0);

          const end = new Date();
          const [endHour, endMin] = entry.end_time.split(':').map(Number);
          end.setHours(endHour, endMin, 0, 0);

          if (entry.is_overnight && end < start) {
            end.setDate(end.getDate() + 1);
          }

          actualHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        } else {
          actualHours = entry.scheduled_hours || 8;
        }
      }
    }

    // Update entry
    const { error: updateError } = await supabase
      .from('time_entries')
      .update({
        status: 'completed',
        actual_hours: actualHours,
        notes: data.notes ? `${entry.notes || ''}\n${data.notes}`.trim() : entry.notes,
      })
      .eq('id', data.entryId);

    if (updateError) throw updateError;

    revalidatePath('/countdown');
    revalidatePath('/calendar');

    return { success: true };
  } catch (error) {
    console.error('Error completing shift:', error);
    return { error: error instanceof Error ? error.message : 'Failed to complete shift' };
  }
}

export async function extendShift(entryId: string, additionalMinutes: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const { data: entry, error: fetchError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;
    if (!entry || !entry.end_time) return { error: 'Entry not found' };

    // Parse end time and add minutes
    const [hours, minutes] = entry.end_time.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes, 0, 0);
    endDate.setMinutes(endDate.getMinutes() + additionalMinutes);

    const newEndTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    const newScheduledHours = (entry.scheduled_hours || 0) + (additionalMinutes / 60);

    const { error: updateError } = await supabase
      .from('time_entries')
      .update({
        end_time: newEndTime,
        scheduled_hours: newScheduledHours,
      })
      .eq('id', entryId);

    if (updateError) throw updateError;

    revalidatePath('/countdown');
    return { success: true };
  } catch (error) {
    console.error('Error extending shift:', error);
    return { error: error instanceof Error ? error.message : 'Failed to extend shift' };
  }
}

export async function saveCountdownSettings(settings: CountdownSettings) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Check if user_settings row exists
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update existing settings
      const { error } = await supabase
        .from('user_settings')
        .update({
          countdown_settings: settings as any,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // Insert new settings row
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          countdown_settings: settings as any,
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving countdown settings:', error);
    return { error: error instanceof Error ? error.message : 'Failed to save settings' };
  }
}

export async function loadCountdownSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", settings: null };
  }

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('countdown_settings')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return {
      success: true,
      settings: data?.countdown_settings as CountdownSettings | null
    };
  } catch (error) {
    console.error('Error loading countdown settings:', error);
    return { error: error instanceof Error ? error.message : 'Failed to load settings', settings: null };
  }
}

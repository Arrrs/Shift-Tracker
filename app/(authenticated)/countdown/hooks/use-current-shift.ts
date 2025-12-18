import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TimeEntry, ShiftTemplate, ActiveShift } from '../types';
import {
  getActiveShiftFromEntry,
  getActiveShiftFromTemplate,
  isTimeInShiftRange,
} from '../utils';

interface UseCurrentShiftOptions {
  autoDetect: boolean;
  selectedJobId?: string | null;
  selectedTemplateId?: string | null;
}

export function useCurrentShift(options: UseCurrentShiftOptions) {
  const { autoDetect, selectedJobId, selectedTemplateId } = options;
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveShift();

    // Refresh every minute to check for shift changes
    const interval = setInterval(loadActiveShift, 60000);
    return () => clearInterval(interval);
  }, [autoDetect, selectedJobId, selectedTemplateId]);

  async function loadActiveShift() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setActiveShift(null);
        return;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Priority 1: Check for active time_entries for today
      // If autoDetect is off, only show manually started shifts (in_progress)
      // If autoDetect is on, also show planned shifts
      const statuses = autoDetect ? ['planned', 'in_progress'] : ['in_progress'];
      const { data: entries, error: entriesError } = await supabase
        .from('time_entries')
        .select(`
          *,
          jobs (*),
          shift_templates:template_id (*)
        `)
        .eq('user_id', user.id)
        .eq('date', today)
        .in('status', statuses)
        .order('start_time', { ascending: true });

      if (entriesError) throw entriesError;

      // Find an entry that matches current time
      if (entries && entries.length > 0) {
        for (const entry of entries as TimeEntry[]) {
          if (!entry.start_time || !entry.end_time) continue;

          // If user selected a specific job, only consider that job
          if (selectedJobId && entry.job_id !== selectedJobId) continue;

          const shift = getActiveShiftFromEntry(entry, now);
          if (shift && shift.status === 'active') {
            setActiveShift(shift);
            return;
          }
        }

        // If no active shift found but we have entries, check if any are starting soon
        // Only show "notStarted" shifts if autoDetect is enabled
        if (autoDetect) {
          const firstEntry = entries[0] as TimeEntry;
          if (firstEntry.start_time) {
            const shift = getActiveShiftFromEntry(firstEntry, now);
            if (shift && shift.status === 'notStarted') {
              setActiveShift(shift);
              return;
            }
          }
        }
      }

      // Priority 2: Check shift templates if auto-detect is enabled
      if (autoDetect) {
        const { data: templates, error: templatesError } = await supabase
          .from('shift_templates')
          .select('*, jobs (*)')
          .eq('user_id', user.id);

        if (templatesError) throw templatesError;

        if (templates && templates.length > 0) {
          // Filter by selected job if specified
          let filteredTemplates = templates as ShiftTemplate[];
          if (selectedJobId) {
            filteredTemplates = filteredTemplates.filter(t => t.job_id === selectedJobId);
          }

          // If specific template selected, use that
          if (selectedTemplateId) {
            const template = filteredTemplates.find(t => t.id === selectedTemplateId);
            if (template) {
              const shift = getActiveShiftFromTemplate(template, now);
              if (shift) {
                setActiveShift(shift);
                return;
              }
            }
          }

          // Otherwise, find first template matching current time
          for (const template of filteredTemplates) {
            if (isTimeInShiftRange(now, template.start_time, template.end_time)) {
              const shift = getActiveShiftFromTemplate(template, now);
              if (shift) {
                setActiveShift(shift);
                return;
              }
            }
          }
        }
      }

      // No active shift found
      setActiveShift(null);
    } catch (err) {
      console.error('Error loading active shift:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shift');
      setActiveShift(null);
    } finally {
      setLoading(false);
    }
  }

  return {
    activeShift,
    loading,
    error,
    refresh: loadActiveShift,
  };
}

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TimeEntry, ActiveShift } from '../types';
import { getActiveShiftFromEntry } from '../utils';

/**
 * Simple hook to find active shift from today's time entries only.
 *
 * Logic:
 * 1. Check for in_progress entry → show countdown to end
 * 2. Check for planned entry within current time → show as active
 * 3. Check for upcoming planned entry today → show "starts in X"
 * 4. No entry → show "Start Shift" button
 */
export function useCurrentShift() {
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveShift();

    // Refresh every minute to check for shift changes
    const interval = setInterval(loadActiveShift, 60000);
    return () => clearInterval(interval);
  }, []);

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

      // Get today's entries that are planned or in_progress
      const { data: entries, error: entriesError } = await supabase
        .from('time_entries')
        .select(`
          *,
          jobs (*),
          shift_templates:template_id (*)
        `)
        .eq('user_id', user.id)
        .eq('date', today)
        .in('status', ['planned', 'in_progress'])
        .eq('entry_type', 'work_shift')
        .order('start_time', { ascending: true });

      if (entriesError) throw entriesError;

      if (!entries || entries.length === 0) {
        setActiveShift(null);
        return;
      }

      // Priority 1: Find in_progress entry (manually started)
      const inProgressEntry = entries.find(e => e.status === 'in_progress') as TimeEntry | undefined;
      if (inProgressEntry && inProgressEntry.start_time && inProgressEntry.end_time) {
        const shift = getActiveShiftFromEntry(inProgressEntry, now);
        if (shift) {
          setActiveShift(shift);
          return;
        }
      }

      // Priority 2: Find planned entry that is currently active (within time range)
      for (const entry of entries as TimeEntry[]) {
        if (!entry.start_time || !entry.end_time) continue;
        if (entry.status !== 'planned') continue;

        const shift = getActiveShiftFromEntry(entry, now);
        if (shift && shift.status === 'active') {
          setActiveShift(shift);
          return;
        }
      }

      // Priority 3: Find next upcoming planned entry today
      for (const entry of entries as TimeEntry[]) {
        if (!entry.start_time || !entry.end_time) continue;
        if (entry.status !== 'planned') continue;

        const shift = getActiveShiftFromEntry(entry, now);
        if (shift && shift.status === 'notStarted') {
          setActiveShift(shift);
          return;
        }
      }

      // No active or upcoming shift found
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

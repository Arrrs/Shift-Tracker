import { TimeEntry, ActiveShift } from "./types";

/**
 * Parse time string (HH:MM) to Date object for today
 */
export function parseTimeToDate(timeStr: string, baseDate: Date = new Date()): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Get active shift from time entry
 */
export function getActiveShiftFromEntry(
  entry: TimeEntry,
  now: Date = new Date()
): ActiveShift | null {
  if (!entry.start_time || !entry.end_time) return null;

  const startTime = parseTimeToDate(entry.start_time, now);
  let endTime: Date;

  if (entry.is_overnight) {
    // For overnight shifts, calculate end time based on scheduled hours
    endTime = new Date(startTime.getTime() + (entry.scheduled_hours || 8) * 3600000);
  } else {
    endTime = parseTimeToDate(entry.end_time, now);
    // If end time is before start time, it's an overnight shift
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
  }

  let status: ActiveShift['status'] = 'active';
  if (now < startTime) status = 'notStarted';
  else if (now > endTime) status = 'ended';

  return {
    entry,
    startTime,
    endTime,
    status,
  };
}

/**
 * Calculate remaining time in milliseconds
 */
export function calculateRemainingTime(endTime: Date, now: Date = new Date()): number {
  return Math.max(0, endTime.getTime() - now.getTime());
}

/**
 * Format time remaining as HH:MM:SS
 */
export function formatTimeRemaining(ms: number): { hours: number; minutes: number; seconds: number } {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}

/**
 * Format time as HH:MM or HH:MM:SS
 */
export function formatTime(date: Date, includeSeconds: boolean = true, use24Hour: boolean = true): string {
  const hours = use24Hour ? date.getHours() : date.getHours() % 12 || 12;
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  if (!use24Hour) {
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return includeSeconds
      ? `${hoursStr}:${minutesStr}:${secondsStr} ${ampm}`
      : `${hoursStr}:${minutesStr} ${ampm}`;
  }

  return includeSeconds
    ? `${hoursStr}:${minutesStr}:${secondsStr}`
    : `${hoursStr}:${minutesStr}`;
}

/**
 * Calculate actual hours worked
 */
export function calculateActualHours(startTime: Date, endTime: Date): number {
  const diff = endTime.getTime() - startTime.getTime();
  return diff / (1000 * 60 * 60); // Convert ms to hours
}

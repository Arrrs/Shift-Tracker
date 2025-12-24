import { TimeEntry, ShiftTemplate, ActiveShift } from "./types";

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
 * Check if current time is within shift time range
 * Handles overnight shifts correctly
 */
export function isTimeInShiftRange(
  now: Date,
  startTime: string,
  endTime: string
): boolean {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const nowHour = now.getHours();
  const nowMin = now.getMinutes();

  // Convert to minutes since midnight for easier comparison
  const nowMins = nowHour * 60 + nowMin;
  const startMins = startHour * 60 + startMin;
  const endMins = endHour * 60 + endMin;

  // Detect overnight shift (end time is earlier than start time)
  const isOvernightShift = endMins <= startMins;

  if (isOvernightShift) {
    // For overnight shifts (e.g., 23:00-07:00), we're in range if:
    // - Current time >= start time (e.g., >= 23:00), OR
    // - Current time <= end time (e.g., <= 07:00)
    return nowMins >= startMins || nowMins <= endMins;
  } else {
    // For regular shifts (e.g., 09:00-17:00), we're in range if:
    // - Current time >= start time AND current time <= end time
    return nowMins >= startMins && nowMins <= endMins;
  }
}

/**
 * Calculate shift end time considering overnight shifts
 */
export function calculateShiftEndTime(
  now: Date,
  startTime: string,
  endTime: string
): Date {
  const start = parseTimeToDate(startTime, now);
  let end = parseTimeToDate(endTime, now);

  const isOvernightShift = end <= start;

  if (isOvernightShift) {
    // For overnight shifts (e.g., 23:00-07:00)
    if (now.getHours() < end.getHours() ||
        (now.getHours() === end.getHours() && now.getMinutes() < end.getMinutes())) {
      // We're in the early morning before shift end - end is today
      // (already set correctly)
    } else {
      // We're in the evening/night - end is tomorrow
      end.setDate(end.getDate() + 1);
    }
  } else {
    // For regular day shifts
    if (now > end) {
      // Shift already ended today, next occurrence is tomorrow
      end.setDate(end.getDate() + 1);
    }
  }

  return end;
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
  const endTime = entry.is_overnight
    ? new Date(startTime.getTime() + (entry.scheduled_hours || 8) * 3600000)
    : parseTimeToDate(entry.end_time, now);

  let status: ActiveShift['status'] = 'active';
  if (now < startTime) status = 'notStarted';
  else if (now > endTime) status = 'ended';

  return {
    entry,
    startTime,
    endTime,
    status,
    source: 'entry',
  };
}

/**
 * Get active shift from template
 */
export function getActiveShiftFromTemplate(
  template: ShiftTemplate,
  now: Date = new Date()
): ActiveShift | null {
  const startTime = parseTimeToDate(template.start_time, now);
  const endTime = calculateShiftEndTime(now, template.start_time, template.end_time);

  const isInRange = isTimeInShiftRange(now, template.start_time, template.end_time);

  let status: ActiveShift['status'] = 'active';
  if (!isInRange) {
    status = now < startTime ? 'notStarted' : 'ended';
  }

  return {
    template,
    startTime,
    endTime,
    status,
    source: 'template',
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

/**
 * Get default counter value from shift
 */
export function getDefaultCounterValue(shift: ActiveShift): number {
  // Default breaks for different shift lengths
  if (shift.entry) {
    const hours = shift.entry.scheduled_hours || shift.entry.actual_hours || 8;
    return hours >= 12 ? 3 : hours >= 8 ? 2 : 1;
  }

  if (shift.template) {
    const hours = shift.template.expected_hours;
    return hours >= 12 ? 3 : hours >= 8 ? 2 : 1;
  }

  return 2; // Default
}

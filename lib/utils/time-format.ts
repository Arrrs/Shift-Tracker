/**
 * Utility functions for time formatting
 */

/**
 * Format hours cleanly by removing unnecessary .0 decimals
 * @param hours - Number of hours
 * @returns Formatted string (e.g., "8h" instead of "8.0h", but "8.5h" stays)
 */
export function formatHours(hours: number): string {
  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
}

/**
 * Extract HH:MM time from a TIMESTAMPTZ string
 * @param timestamp - ISO timestamp string (e.g., "2024-12-07T14:30:00+00:00")
 * @returns Time in HH:MM format (e.g., "14:30")
 */
export function formatTimeFromTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    return date.toTimeString().slice(0, 5); // "HH:MM"
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "";
  }
}

/**
 * Get currency symbol from currency code
 * @param currency - Currency code (USD, EUR, UAH, etc.)
 * @returns Currency symbol ($, €, ₴, etc.)
 */
export function getCurrencySymbol(currency: string | null | undefined): string {
  if (!currency) return "$";

  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    UAH: "₴",
    PLN: "zł",
    CZK: "Kč",
    JPY: "¥",
    CNY: "¥",
    RUB: "₽",
    CAD: "CA$",
    AUD: "A$",
  };

  return symbols[currency.toUpperCase()] || currency;
}

/**
 * Format currency amount cleanly (no unnecessary decimals)
 * @param amount - Amount to format
 * @returns Formatted string (e.g., "55" not "55.00", but "46.80" stays)
 */
export function formatCurrency(amount: number): string {
  // If it's a whole number, show no decimals
  if (amount % 1 === 0) {
    return amount.toFixed(0);
  }
  // Otherwise show 2 decimals
  return amount.toFixed(2);
}

/**
 * Get status badge info (emoji, color, label)
 * @param status - Shift status
 * @returns Object with emoji, color class, and label
 */
export function getStatusInfo(status: string | null | undefined) {
  const statusMap = {
    planned: {
      emoji: "📅",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      borderColor: "border-blue-300 dark:border-blue-700",
      label: "Planned",
    },
    in_progress: {
      emoji: "⏳",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      borderColor: "border-yellow-300 dark:border-yellow-700",
      label: "In Progress",
    },
    completed: {
      emoji: "✅",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      borderColor: "border-green-300 dark:border-green-700",
      label: "Completed",
    },
    cancelled: {
      emoji: "❌",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      borderColor: "border-red-300 dark:border-red-700",
      label: "Cancelled",
    },
  };

  return statusMap[status as keyof typeof statusMap] || statusMap.planned;
}

/**
 * Calculate shift earnings based on job pay type (hourly, daily, monthly, salary)
 * @param shift - Shift object with rate and type information
 * @param job - Job object with pay type and rate information
 * @returns Total earnings for the shift
 */
export function calculateShiftEarnings(
  shift: {
    actual_hours?: number | null;
    shift_type?: string | null;
    custom_hourly_rate?: number | null;
    is_holiday?: boolean | null;
    holiday_multiplier?: number | null;
    holiday_fixed_rate?: number | null;
  },
  job: {
    pay_type?: string | null;
    hourly_rate?: number | null;
    daily_rate?: number | null;
    monthly_rate?: number | null;
    annual_salary?: number | null;
  } | null
): number {
  if (!job) return 0;

  const hours = shift.actual_hours || 0;
  const payType = job.pay_type || 'hourly';
  let earnings = 0;

  // Handle day-offs
  if (shift.shift_type && shift.shift_type !== 'work') {
    if (['pto', 'sick', 'personal', 'bereavement', 'maternity', 'paternity', 'jury_duty'].includes(shift.shift_type)) {
      if (payType === 'daily') {
        earnings = job.daily_rate || 0;
      } else if (payType === 'monthly') {
        earnings = (job.monthly_rate || 0) / 30.44;
      } else if (payType === 'salary') {
        earnings = (job.annual_salary || 0) / 365;
      } else {
        earnings = hours * (job.hourly_rate || 0);
      }
    }
    return Math.round(earnings * 100) / 100;
  }

  // Regular work shifts
  if (payType === 'daily') {
    return Math.round((job.daily_rate || 0) * 100) / 100;
  } else if (payType === 'monthly') {
    return Math.round(((job.monthly_rate || 0) / 22) * 100) / 100; // 22 working days per month
  } else if (payType === 'salary') {
    return Math.round(((job.annual_salary || 0) / 260) * 100) / 100; // 260 working days per year
  }

  // Hourly rate (with custom rates and holiday pay)
  let rate = 0;
  if (shift.is_holiday && shift.holiday_fixed_rate) {
    rate = shift.holiday_fixed_rate;
  } else {
    const baseRate = shift.custom_hourly_rate || job.hourly_rate || 0;
    rate = shift.is_holiday && shift.holiday_multiplier
      ? baseRate * shift.holiday_multiplier
      : baseRate;
  }
  // Round to 2 decimal places to avoid floating point precision issues
  return Math.round((hours * rate) * 100) / 100;
}

/**
 * Calculate effective hourly rate for a shift including custom rates, holiday pay, day-offs, etc.
 * @param shift - Shift object with rate information
 * @param jobRate - Default job hourly rate (fallback)
 * @returns Effective hourly rate
 */
export function calculateEffectiveRate(
  shift: {
    shift_type?: string | null;
    custom_hourly_rate?: number | null;
    is_holiday?: boolean | null;
    holiday_multiplier?: number | null;
    holiday_fixed_rate?: number | null;
  },
  jobRate: number = 0
): number {
  // Handle day-offs first
  if (shift.shift_type && shift.shift_type !== 'work') {
    // Paid time-off (PTO, sick, personal, etc.) earns at base job rate
    if (['pto', 'sick', 'personal', 'bereavement', 'maternity', 'paternity', 'jury_duty'].includes(shift.shift_type)) {
      return jobRate;
    } else {
      // Unpaid leave = zero earnings
      return 0;
    }
  }

  // Regular work shift - apply custom rates and holiday pay
  // If holiday shift with fixed rate, use that
  if (shift.is_holiday && shift.holiday_fixed_rate) {
    return shift.holiday_fixed_rate;
  }

  // Use custom rate if available, otherwise use job rate
  const baseRate = shift.custom_hourly_rate || jobRate;

  // Apply holiday multiplier if this is a holiday shift
  if (shift.is_holiday && shift.holiday_multiplier) {
    return baseRate * shift.holiday_multiplier;
  }

  return baseRate;
}

/**
 * Utility functions for time formatting
 */

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

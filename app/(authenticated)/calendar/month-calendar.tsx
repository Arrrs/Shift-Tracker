"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Database } from "@/lib/database.types";
import { getStatusInfo, getCurrencySymbol, formatCurrency } from "@/lib/utils/time-format";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
  shift_templates: Database["public"]["Tables"]["shift_templates"]["Row"] | null;
};

type FinancialRecord = Database["public"]["Tables"]["financial_records"]["Row"] & {
  financial_categories?: Database["public"]["Tables"]["financial_categories"]["Row"] | null;
  jobs?: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

interface MonthCalendarProps {
  currentDate: Date;
  entries?: TimeEntry[];
  financialRecords?: FinancialRecord[];
  onDayClick?: (date: Date) => void;
}

export function MonthCalendar({ currentDate, entries = [], financialRecords = [], onDayClick }: MonthCalendarProps) {
  const { t } = useTranslation();
  const calendar = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week for first day (0 = Sunday)
    const startingDayOfWeek = firstDay.getDay();

    // Get total days in month
    const daysInMonth = lastDay.getDate();

    // Calculate days from previous month to show
    const daysFromPrevMonth = startingDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Calculate total cells needed (6 weeks max)
    const totalCells = 42;

    const days: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      days.push({
        date: new Date(year, month - 1, day),
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Add days from current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);

      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      });
    }

    // Add days from next month
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentDate]);

  const weekDays = [
    t("weekdaySundayShort"),
    t("weekdayMondayShort"),
    t("weekdayTuesdayShort"),
    t("weekdayWednesdayShort"),
    t("weekdayThursdayShort"),
    t("weekdayFridayShort"),
    t("weekdaySaturdayShort"),
  ];

  // Get time entries for a specific date
  const getEntriesForDate = (date: Date) => {
    // Format date in local timezone to avoid UTC conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return entries.filter((entry) => entry.date === dateStr);
  };

  // Get financial records for a specific date
  const getFinancialRecordsForDate = (date: Date) => {
    // Format date in local timezone to avoid UTC conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return financialRecords.filter((record) => record.date === dateStr);
  };

  // Get simple count for a date (no earnings in new schema - will be in income_records)
  const getEntryCountForDate = (date: Date): number => {
    const dayEntries = getEntriesForDate(date);
    return dayEntries.length;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-xs md:text-sm font-semibold text-muted-foreground py-1 md:py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - 6 rows of equal height */}
      <div className="grid grid-cols-7 grid-rows-6 gap-1 md:gap-2 flex-1 min-h-0">
        {calendar.map((day, index) => {
          const dayEntries = getEntriesForDate(day.date);
          const dayFinancialRecords = getFinancialRecordsForDate(day.date);
          const hasEntries = dayEntries.length > 0;
          const hasFinancialRecords = dayFinancialRecords.length > 0;
          const hasAnyContent = hasEntries || hasFinancialRecords;

          // Count financial records by type and status (exclude cancelled)
          const incomeRecords = dayFinancialRecords.filter(r => r.type === 'income' && r.status !== 'cancelled');
          const expenseRecords = dayFinancialRecords.filter(r => r.type === 'expense' && r.status !== 'cancelled');
          const hasPlannedFinancials = dayFinancialRecords.some(r => r.status === 'planned');

          return (
            <button
              key={index}
              onClick={() => day.isCurrentMonth && onDayClick?.(day.date)}
              className={cn(
                "min-h-0 p-1.5 md:p-2 rounded-md md:rounded-lg border transition-colors",
                "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary",
                !day.isCurrentMonth && "text-muted-foreground/40 bg-muted/20",
                day.isToday && "border-primary border-2 font-semibold",
                day.isCurrentMonth && "cursor-pointer",
                hasAnyContent && day.isCurrentMonth && "bg-primary/5"
              )}
              disabled={!day.isCurrentMonth}
            >
              <div className="flex flex-col h-full min-h-0">
                <span className="text-xs md:text-sm mb-0.5 md:mb-1">{day.dayNumber}</span>

                {/* Entry indicators */}
                {day.isCurrentMonth && hasAnyContent && (
                  <div className="flex-1 flex flex-col gap-0.5 md:gap-1 overflow-hidden min-h-0">
                    {/* Shift entry color dots with status indicators */}
                    {hasEntries && (
                      <div className="flex gap-0.5 md:gap-1 flex-wrap items-center">
                        {dayEntries.slice(0, 3).map((entry, idx) => {
                          const status = getStatusInfo(entry.status || "planned");
                          return (
                            <div
                              key={idx}
                              className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 relative"
                              style={{
                                backgroundColor: entry.jobs?.color || "#9CA3AF",
                                opacity: entry.status === "cancelled" ? 0.4 : 1,
                                border: entry.status === "completed" ? "1.5px solid #10B981" :
                                        entry.status === "in_progress" ? "1.5px solid #F59E0B" :
                                        "none",
                              }}
                              title={`${entry.jobs?.name || entry.entry_type === "day_off" ? "Day Off" : "Personal Time"} - ${status.label}`}
                            />
                          );
                        })}
                        {dayEntries.length > 3 && (
                          <span className="text-[9px] md:text-[10px] text-muted-foreground">
                            +{dayEntries.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Financial record indicators */}
                    {hasFinancialRecords && (
                      <div className="flex flex-col gap-0.5 items-start">
                        {incomeRecords.length > 0 && (
                          <div className="flex items-center gap-0.5">
                            <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3 text-green-600 dark:text-green-400" />
                            <span className="text-[9px] md:text-[10px] text-green-600 dark:text-green-400 font-medium">
                              {incomeRecords.length}
                            </span>
                          </div>
                        )}
                        {expenseRecords.length > 0 && (
                          <div className="flex items-center gap-0.5">
                            <TrendingDown className="h-2.5 w-2.5 md:h-3 md:w-3 text-red-600 dark:text-red-400" />
                            <span className="text-[9px] md:text-[10px] text-red-600 dark:text-red-400 font-medium">
                              {expenseRecords.length}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

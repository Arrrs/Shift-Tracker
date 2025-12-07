"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Database } from "@/lib/database.types";
import { getStatusInfo } from "@/lib/utils/time-format";

type Shift = Database["public"]["Tables"]["shifts"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

interface MonthCalendarProps {
  currentDate: Date;
  shifts?: Shift[];
  onDayClick?: (date: Date) => void;
}

export function MonthCalendar({ currentDate, shifts = [], onDayClick }: MonthCalendarProps) {
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

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get shifts for a specific date
  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return shifts.filter((shift) => shift.date === dateStr);
  };

  // Get total earnings for a date
  const getEarningsForDate = (date: Date) => {
    const dayShifts = getShiftsForDate(date);
    return dayShifts.reduce((sum, shift) => {
      const hours = shift.actual_hours || 0;
      const rate = shift.jobs?.hourly_rate || 0;
      return sum + (hours * rate);
    }, 0);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs md:text-sm font-semibold text-muted-foreground py-1 md:py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - 6 rows of equal height */}
      <div className="grid grid-cols-7 grid-rows-6 gap-1 md:gap-2 flex-1 min-h-0">
        {calendar.map((day, index) => {
          const dayShifts = getShiftsForDate(day.date);
          const earnings = getEarningsForDate(day.date);
          const hasShifts = dayShifts.length > 0;

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
                hasShifts && day.isCurrentMonth && "bg-primary/5"
              )}
              disabled={!day.isCurrentMonth}
            >
              <div className="flex flex-col h-full min-h-0">
                <span className="text-xs md:text-sm mb-0.5 md:mb-1">{day.dayNumber}</span>

                {/* Shift indicators */}
                {day.isCurrentMonth && hasShifts && (
                  <div className="flex-1 flex flex-col gap-0.5 md:gap-1 overflow-hidden min-h-0">
                    {/* Shift color dots with status indicators */}
                    <div className="flex gap-0.5 md:gap-1 flex-wrap items-center">
                      {dayShifts.slice(0, 3).map((shift, idx) => {
                        const status = getStatusInfo(shift.status);
                        return (
                          <div
                            key={idx}
                            className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 relative"
                            style={{
                              backgroundColor: shift.jobs?.color || "#9CA3AF",
                              opacity: shift.status === "cancelled" ? 0.4 : 1,
                              border: shift.status === "completed" ? "1.5px solid #10B981" :
                                      shift.status === "in_progress" ? "1.5px solid #F59E0B" :
                                      "none",
                            }}
                            title={`${shift.jobs?.name || "Personal Time"} - ${status.label}`}
                          />
                        );
                      })}
                      {dayShifts.length > 3 && (
                        <span className="text-[9px] md:text-[10px] text-muted-foreground">
                          +{dayShifts.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Earnings display with status emoji for single shift */}
                    {earnings > 0 && (
                      <div className="text-[9px] md:text-[10px] font-medium text-muted-foreground truncate flex items-center gap-0.5">
                        <span>${earnings.toFixed(0)}</span>
                        {dayShifts.length === 1 && (
                          <span className="text-[8px] md:text-[9px]">
                            {getStatusInfo(dayShifts[0].status).emoji}
                          </span>
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

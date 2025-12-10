"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Database } from "@/lib/database.types";
import { EditShiftDialog } from "./edit-shift-dialog";
import { AddShiftDialog } from "./add-shift-dialog";
import { Clock, DollarSign } from "lucide-react";
import { formatTimeFromTimestamp, getStatusInfo, getCurrencySymbol, formatHours, formatCurrency } from "@/lib/utils/time-format";

type Shift = Database["public"]["Tables"]["shifts"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

interface DayShiftsDrawerProps {
  date: Date | null;
  shifts: Shift[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShiftChange?: () => void;
}

export function DayShiftsDrawer({
  date,
  shifts,
  open,
  onOpenChange,
  onShiftChange,
}: DayShiftsDrawerProps) {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!date) return null;

  const dateStr = date.toISOString().split("T")[0];
  const dayShifts = shifts.filter((shift) => shift.date === dateStr);

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Calculate total hours - only count completed shifts
  const completedShifts = dayShifts.filter(s => s.status === 'completed');
  const totalHours = completedShifts.reduce((sum, shift) => sum + (shift.actual_hours || 0), 0);

  // Calculate total worked hours vs time-off hours - only count completed shifts
  const totalWorkedHours = completedShifts
    .filter(s => !s.shift_type || s.shift_type === 'work')
    .reduce((sum, shift) => sum + (shift.actual_hours || 0), 0);
  const totalTimeOffHours = completedShifts
    .filter(s => s.shift_type && s.shift_type !== 'work')
    .reduce((sum, shift) => sum + (shift.actual_hours || 0), 0);

  // SNAPSHOT ARCHITECTURE: Use actual_earnings instead of calculating
  // Calculate earnings by currency - only count completed shifts (NEVER mix currencies!)
  // Exclude fixed income jobs (monthly/salary with show_in_fixed_income = true)
  const earningsByCurrency: Record<string, number> = {};
  completedShifts.forEach((shift) => {
    const payType = shift.jobs?.pay_type || 'hourly';
    const isFixedIncome = shift.jobs?.show_in_fixed_income && (payType === 'monthly' || payType === 'salary');

    // Skip fixed income jobs - they're shown separately
    if (isFixedIncome) return;

    // Use snapshot earnings
    const earnings = shift.actual_earnings || 0;
    const currency = shift.earnings_currency || shift.jobs?.currency || 'USD';

    // Skip if no earnings (time tracking only)
    if (earnings === 0 || shift.actual_earnings === null) return;

    if (!earningsByCurrency[currency]) {
      earningsByCurrency[currency] = 0;
    }
    earningsByCurrency[currency] += earnings;
  });

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    onShiftChange?.();
  };

  const content = (
    <>
      <div className="space-y-4">
        {/* Summary */}
        {dayShifts.length > 0 && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
            {/* Hours Breakdown */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
              <p className="text-lg font-semibold">{formatHours(totalHours)}</p>
              {totalTimeOffHours > 0 && (
                <p className="text-xs text-muted-foreground">
                  Worked: {formatHours(totalWorkedHours)} | Time-off: {formatHours(totalTimeOffHours)}
                </p>
              )}
            </div>

            {/* Earnings by Currency */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
              {Object.keys(earningsByCurrency).length === 1 ? (
                // Single currency - simple display
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {getCurrencySymbol(Object.keys(earningsByCurrency)[0])} {formatCurrency(Object.values(earningsByCurrency)[0])}
                </p>
              ) : (
                // Multiple currencies - show breakdown
                <div className="space-y-1">
                  {Object.entries(earningsByCurrency).map(([currency, amount]) => (
                    <p key={currency} className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {getCurrencySymbol(currency)} {formatCurrency(amount)} <span className="text-xs text-muted-foreground">({currency})</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shifts List */}
        {dayShifts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No shifts scheduled for this day
            </p>
            <AddShiftDialog selectedDate={date} onSuccess={handleEditSuccess} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {dayShifts.map((shift) => {
                const hours = shift.actual_hours || 0;
                // SNAPSHOT ARCHITECTURE: Use stored earnings
                const earnings = shift.actual_earnings || 0;
                const status = getStatusInfo(shift.status);
                const startTime = formatTimeFromTimestamp(shift.start_time);
                const endTime = formatTimeFromTimestamp(shift.end_time);
                const isDayOff = shift.shift_type && shift.shift_type !== 'work';

                // Calculate display rate based on pay type
                const payType = shift.jobs?.pay_type || 'hourly';
                let rateDisplay = '';
                if (payType === 'daily') {
                  rateDisplay = `${formatCurrency(shift.jobs?.daily_rate || 0)}/day`;
                } else if (payType === 'monthly') {
                  rateDisplay = `${formatCurrency(shift.jobs?.monthly_rate || 0)}/mo`;
                } else if (payType === 'salary') {
                  rateDisplay = `${formatCurrency(shift.jobs?.annual_salary || 0)}/yr`;
                } else {
                  const hourlyRate = shift.custom_hourly_rate || shift.jobs?.hourly_rate || 0;
                  const rate = shift.is_holiday && shift.holiday_fixed_rate
                    ? shift.holiday_fixed_rate
                    : shift.is_holiday && shift.holiday_multiplier
                      ? hourlyRate * shift.holiday_multiplier
                      : hourlyRate;
                  rateDisplay = `${formatCurrency(rate)}/hr`;
                }

                // Day-off type labels
                const dayOffLabels: Record<string, string> = {
                  pto: '🏖️ PTO / Vacation',
                  sick: '🤒 Sick Day',
                  personal: '👤 Personal Day',
                  unpaid: '⛔ Unpaid Leave',
                  bereavement: '🕊️ Bereavement',
                  maternity: '🍼 Maternity Leave',
                  paternity: '👶 Paternity Leave',
                  jury_duty: '⚖️ Jury Duty',
                };

                return (
                  <button
                    key={shift.id}
                    onClick={() => handleShiftClick(shift)}
                    className={`w-full border rounded-lg p-3 hover:bg-muted/50 transition-colors text-left ${status.borderColor} ${isDayOff ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left side */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {shift.jobs ? (
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: shift.jobs.color || "#3B82F6" }}
                            />
                          ) : (
                            <div className="w-3 h-3 rounded bg-gray-400" />
                          )}
                          <h4 className="font-semibold text-sm">
                            {shift.jobs?.name || "Personal Time"}
                          </h4>
                          <span className="text-xs">{status.emoji}</span>
                        </div>

                        {isDayOff ? (
                          /* Day-off specific display */
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                              <span>{dayOffLabels[shift.shift_type || 'pto']}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {shift.is_full_day_off ? 'Full day' : 'Partial day'} ({formatHours(hours)})
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Regular shift display */
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {startTime} - {endTime}
                              </span>
                              <span className="ml-1">({formatHours(shift.actual_hours || 0)})</span>
                              {shift.is_overnight && (
                                <span className="text-orange-500 text-[10px]">overnight</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              <span>
                                {getCurrencySymbol(shift.jobs?.currency || 'USD')} {rateDisplay}
                                {payType === 'hourly' && shift.custom_hourly_rate && (
                                  <span className="text-blue-500 text-[10px] ml-1">custom</span>
                                )}
                                {payType === 'hourly' && shift.is_holiday && shift.holiday_fixed_rate && (
                                  <span className="text-purple-500 text-[10px] ml-1">
                                    holiday fixed
                                  </span>
                                )}
                                {payType === 'hourly' && shift.is_holiday && shift.holiday_multiplier && !shift.holiday_fixed_rate && (
                                  <span className="text-purple-500 text-[10px] ml-1">
                                    holiday {shift.holiday_multiplier}x
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        )}

                        {shift.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {shift.notes}
                          </p>
                        )}
                      </div>

                      {/* Right side - Earnings or Day-off badge */}
                      <div className="text-right">
                        {isDayOff ? (
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            Time Off
                          </div>
                        ) : shift.jobs?.show_in_fixed_income && (payType === 'monthly' || payType === 'salary') ? (
                          // Don't show per-shift earnings for fixed income jobs
                          <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            Fixed Income
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {getCurrencySymbol(shift.earnings_currency || shift.jobs?.currency || 'USD')} {formatCurrency(earnings)}
                          </p>
                        )}
                        <p className={`text-[10px] ${status.color}`}>
                          {status.label}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Add Shift Button */}
            <div className="pt-2 border-t flex justify-end pt-3">
              <AddShiftDialog selectedDate={date} onSuccess={handleEditSuccess} />
            </div>
          </div>
        )}
      </div>

      <EditShiftDialog
        shift={selectedShift}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{formattedDate}</DrawerTitle>
            <DrawerDescription>
              {dayShifts.length} {dayShifts.length === 1 ? "shift" : "shifts"} scheduled
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formattedDate}</DialogTitle>
          <DialogDescription>
            {dayShifts.length} {dayShifts.length === 1 ? "shift" : "shifts"} scheduled
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

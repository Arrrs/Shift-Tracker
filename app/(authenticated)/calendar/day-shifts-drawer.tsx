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
import { EditTimeEntryDialog } from "./edit-time-entry-dialog";
import { AddTimeEntryDialog } from "./add-time-entry-dialog";
import { EditFinancialRecordDialog } from "./edit-financial-record-dialog";
import { AddFinancialRecordDialog } from "../finances/add-financial-record-dialog";
import { Clock, Coins, TrendingUp, TrendingDown, Plus, ChevronDown } from "lucide-react";
import { formatTimeFromTimestamp, getStatusInfo, getCurrencySymbol, formatHours, formatCurrency } from "@/lib/utils/time-format";
import { getIncomeRecords } from "@/app/(authenticated)/time-entries/actions";
import { getFinancialRecords } from "@/app/(authenticated)/finances/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";

// Helper to format date in local timezone without UTC conversion
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
  shift_templates: Database["public"]["Tables"]["shift_templates"]["Row"] | null;
};

type IncomeRecord = Database["public"]["Tables"]["income_records"]["Row"];

type FinancialRecord = Database["public"]["Tables"]["financial_records"]["Row"] & {
  financial_categories?: Database["public"]["Tables"]["financial_categories"]["Row"] | null;
  jobs?: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

interface DayShiftsDrawerProps {
  date: Date | null;
  entries: TimeEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryChange?: () => void;
}

export function DayShiftsDrawer({
  date,
  entries,
  open,
  onOpenChange,
  onEntryChange,
}: DayShiftsDrawerProps) {
  const { t } = useTranslation();
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [loadingIncome, setLoadingIncome] = useState(false);

  // Financial records state
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState<FinancialRecord | null>(null);
  const [editFinancialDialogOpen, setEditFinancialDialogOpen] = useState(false);
  const [addFinancialDialogOpen, setAddFinancialDialogOpen] = useState(false);
  const [addFinancialType, setAddFinancialType] = useState<"income" | "expense">("income");

  // Detect mobile on mount (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset state when drawer closes or date changes
  useEffect(() => {
    if (!open) {
      setIncomeRecords([]);
      setFinancialRecords([]);
      setLoadingIncome(false);
      setLoadingFinancial(false);
    }
  }, [open]);

  // Reset state immediately when date changes (before fetching new data)
  useEffect(() => {
    if (date && open) {
      setIncomeRecords([]);
      setFinancialRecords([]);
    }
  }, [date, open]);

  // Fetch income records for the selected day
  useEffect(() => {
    if (!date || !open) return;

    const fetchIncome = async () => {
      setLoadingIncome(true);
      const dateStr = formatLocalDate(date);
      const result = await getIncomeRecords(dateStr, dateStr);
      if (result.records) {
        setIncomeRecords(result.records);
      }
      setLoadingIncome(false);
    };

    fetchIncome();
  }, [date, open, entries]);

  // Fetch financial records for the selected day
  useEffect(() => {
    if (!date || !open) return;

    const fetchFinancial = async () => {
      setLoadingFinancial(true);
      const dateStr = formatLocalDate(date);
      const result = await getFinancialRecords(dateStr, dateStr);
      if (result.records) {
        setFinancialRecords(result.records);
      }
      setLoadingFinancial(false);
    };

    fetchFinancial();
  }, [date, open]);

  if (!date) return null;

  const dateStr = formatLocalDate(date);
  const dayEntries = entries.filter((entry) => entry.date === dateStr);

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Calculate total hours - only count completed entries
  const completedEntries = dayEntries.filter(e => e.status === 'completed');
  const totalHours = completedEntries.reduce((sum, entry) => sum + (entry.actual_hours || 0), 0);

  // Calculate expected hours - all non-cancelled entries
  const activeEntries = dayEntries.filter(e => e.status !== 'cancelled');
  const expectedHours = activeEntries.reduce((sum, entry) => sum + (entry.actual_hours || 0), 0);

  // Calculate total worked hours vs day-off hours - only count completed entries
  const totalWorkedHours = completedEntries
    .filter(e => e.entry_type === 'work_shift')
    .reduce((sum, entry) => sum + (entry.actual_hours || 0), 0);
  const totalDayOffHours = completedEntries
    .filter(e => e.entry_type === 'day_off')
    .reduce((sum, entry) => sum + (entry.actual_hours || 0), 0);

  // Calculate income totals by currency (completed shifts only - from income_records)
  const shiftIncomeByCurrency: Record<string, number> = {};
  console.log('DEBUG - Income records for', dateStr, ':', incomeRecords.length, 'records');
  incomeRecords.forEach((record) => {
    console.log('  Income:', {
      id: record.id.substring(0, 8),
      time_entry_id: record.time_entry_id?.substring(0, 8) || 'NULL',
      amount: record.amount,
      currency: record.currency,
      date: record.date,
    });
    const currency = record.currency || 'USD';
    shiftIncomeByCurrency[currency] = (shiftIncomeByCurrency[currency] || 0) + record.amount;
  });
  console.log('DEBUG - Shift income by currency:', shiftIncomeByCurrency);

  // Calculate financial records totals by currency, type, and status
  const financialIncomeByCurrency: Record<string, number> = {};
  const financialExpenseByCurrency: Record<string, number> = {};
  const plannedFinancialIncomeByCurrency: Record<string, number> = {};
  const plannedFinancialExpenseByCurrency: Record<string, number> = {};

  financialRecords.forEach((record) => {
    const currency = record.currency || 'USD';
    const isCompleted = record.status === 'completed';
    const isPlanned = record.status === 'planned';

    // Only include completed and planned records in totals (exclude cancelled)
    if (record.type === 'income' && isCompleted) {
      financialIncomeByCurrency[currency] = (financialIncomeByCurrency[currency] || 0) + Number(record.amount);
    } else if (record.type === 'expense' && isCompleted) {
      financialExpenseByCurrency[currency] = (financialExpenseByCurrency[currency] || 0) + Number(record.amount);
    } else if (record.type === 'income' && isPlanned) {
      plannedFinancialIncomeByCurrency[currency] = (plannedFinancialIncomeByCurrency[currency] || 0) + Number(record.amount);
    } else if (record.type === 'expense' && isPlanned) {
      plannedFinancialExpenseByCurrency[currency] = (plannedFinancialExpenseByCurrency[currency] || 0) + Number(record.amount);
    }
  });

  // Calculate expected income by currency (all non-cancelled work shifts)
  // For completed shifts: use actual income records
  // For planned/in-progress shifts: estimate based on job rates (if job exists)
  const expectedIncomeByCurrency: Record<string, number> = {};

  // First, add all completed shift income from income records
  incomeRecords.forEach((record) => {
    const currency = record.currency || 'USD';
    expectedIncomeByCurrency[currency] = (expectedIncomeByCurrency[currency] || 0) + record.amount;
  });

  // Backwards compatibility - keep incomeByCurrency for existing code
  const incomeByCurrency = shiftIncomeByCurrency;

  // Then, add estimated income for planned/in-progress shifts
  const hasPlannedShifts = activeEntries.some(e =>
    e.entry_type === 'work_shift' && e.status !== 'completed' && e.status !== 'cancelled'
  );

  activeEntries.forEach((entry) => {
    // Only estimate for non-completed work shifts
    if (entry.entry_type === 'work_shift' &&
        entry.status !== 'completed' &&
        entry.status !== 'cancelled') {

      const currency = entry.custom_currency || entry.jobs?.currency || 'USD';
      let estimatedAmount = 0;
      const hours = entry.actual_hours || entry.scheduled_hours || 0;

      console.log('DEBUG - Calculating expected income for planned shift:', {
        id: entry.id.substring(0, 8),
        status: entry.status,
        hours,
        pay_override_type: entry.pay_override_type,
        custom_hourly_rate: entry.custom_hourly_rate,
        custom_daily_rate: entry.custom_daily_rate,
        holiday_fixed_amount: entry.holiday_fixed_amount,
        holiday_multiplier: entry.holiday_multiplier,
        hasJob: !!entry.jobs,
        jobPayType: entry.jobs?.pay_type,
        jobHourlyRate: entry.jobs?.hourly_rate,
        jobDailyRate: entry.jobs?.daily_rate,
        currency,
      });

      // Priority 1: Fixed amount
      if (entry.pay_override_type === 'fixed_amount' && entry.holiday_fixed_amount) {
        estimatedAmount = entry.holiday_fixed_amount;
        console.log('  → Using fixed amount:', estimatedAmount);
      }
      // Priority 2: Custom rates with optional multiplier
      else if (entry.custom_hourly_rate && hours > 0) {
        const multiplier = entry.holiday_multiplier || 1;
        estimatedAmount = hours * entry.custom_hourly_rate * multiplier;
        console.log('  → Using custom hourly:', { hours, rate: entry.custom_hourly_rate, multiplier, estimatedAmount });
      }
      else if (entry.custom_daily_rate) {
        const multiplier = entry.holiday_multiplier || 1;
        estimatedAmount = entry.custom_daily_rate * multiplier;
        console.log('  → Using custom daily:', { rate: entry.custom_daily_rate, multiplier, estimatedAmount });
      }
      // Priority 3: Job rates with optional multiplier (ONLY hourly/daily, NOT salary)
      else if (entry.jobs && (entry.jobs.pay_type === 'hourly' || entry.jobs.pay_type === 'daily')) {
        const job = entry.jobs;
        const multiplier = entry.holiday_multiplier || 1;

        if (job.pay_type === 'hourly' && job.hourly_rate && hours > 0) {
          estimatedAmount = hours * job.hourly_rate * multiplier;
          console.log('  → Using job hourly:', { hours, rate: job.hourly_rate, multiplier, estimatedAmount });
        } else if (job.pay_type === 'daily' && job.daily_rate) {
          estimatedAmount = job.daily_rate * multiplier;
          console.log('  → Using job daily:', { rate: job.daily_rate, multiplier, estimatedAmount });
        }
      } else {
        console.log('  → No calculable rate (salary or no rate)');
      }

      // Add estimated income for planned shifts
      if (estimatedAmount > 0) {
        expectedIncomeByCurrency[currency] = (expectedIncomeByCurrency[currency] || 0) + estimatedAmount;
        console.log('  → Added to expected total:', { currency, amount: estimatedAmount, newTotal: expectedIncomeByCurrency[currency] });
      }
    }
  });

  const handleEntryClick = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = async () => {
    // Refetch income records after edit/delete
    if (date) {
      const dateStr = formatLocalDate(date);
      const result = await getIncomeRecords(dateStr, dateStr);
      if (result.records) {
        setIncomeRecords(result.records);
      }
    }
    onEntryChange?.();
  };

  const handleFinancialSuccess = async () => {
    // Refetch financial records after edit/delete/add
    if (date) {
      const dateStr = formatLocalDate(date);
      const result = await getFinancialRecords(dateStr, dateStr);
      if (result.records) {
        setFinancialRecords(result.records);
      }
    }
    onEntryChange?.();
  };

  const content = (
    <>
      <div className="space-y-4">
        {/* Summary */}
        {dayEntries.length > 0 && (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
            {/* Hours Breakdown */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("hoursCompleted")}</p>
              <p className="text-lg font-semibold">{formatHours(totalHours)}</p>
              {totalDayOffHours > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("worked")}: {formatHours(totalWorkedHours)} | {t("dayOff")}: {formatHours(totalDayOffHours)}
                </p>
              )}
              {expectedHours !== totalHours && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("expected")}: {formatHours(expectedHours)} ({t("inclPlanned")})
                </p>
              )}
            </div>

            {/* Financial Summary by Currency */}
            {(Object.keys(shiftIncomeByCurrency).length > 0 ||
              Object.keys(expectedIncomeByCurrency).length > 0 ||
              Object.keys(financialIncomeByCurrency).length > 0 ||
              Object.keys(financialExpenseByCurrency).length > 0 ||
              Object.keys(plannedFinancialIncomeByCurrency).length > 0 ||
              Object.keys(plannedFinancialExpenseByCurrency).length > 0) && (
              <div className="border-t pt-3 space-y-3">
                {/* Shift Income (Completed) */}
                {Object.keys(shiftIncomeByCurrency).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">{t("shiftIncomeLabel")}</p>
                    <div className="space-y-1">
                      {Object.entries(shiftIncomeByCurrency).map(([currency, amount]) => (
                        <div key={currency} className="flex items-center gap-1">
                          <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                            {getCurrencySymbol(currency)}{amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">{currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expected Income from Planned Shifts */}
                {hasPlannedShifts && Object.keys(expectedIncomeByCurrency).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">{t("expectedPlannedShifts")}</p>
                    <div className="space-y-1">
                      {Object.entries(expectedIncomeByCurrency).map(([currency, amount]) => (
                        <div key={currency} className="flex items-center gap-1">
                          <span className="text-base font-semibold text-amber-600 dark:text-amber-400">
                            {getCurrencySymbol(currency)}{amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">{currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Income (Financial Records) */}
                {Object.keys(financialIncomeByCurrency).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {t("otherIncome")}
                    </p>
                    <div className="space-y-1">
                      {Object.entries(financialIncomeByCurrency).map(([currency, amount]) => (
                        <div key={currency} className="flex items-center gap-1">
                          <span className="text-base font-semibold text-green-600 dark:text-green-400">
                            {getCurrencySymbol(currency)}{amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">{currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expenses (Financial Records - Completed) */}
                {Object.keys(financialExpenseByCurrency).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {t("expenses")}
                    </p>
                    <div className="space-y-1">
                      {Object.entries(financialExpenseByCurrency).map(([currency, amount]) => (
                        <div key={currency} className="flex items-center gap-1">
                          <span className="text-base font-semibold text-red-600 dark:text-red-400">
                            -{getCurrencySymbol(currency)}{amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">{currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Planned Financial Income */}
                {Object.keys(plannedFinancialIncomeByCurrency).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {t("expectedIncomePlanned")}
                    </p>
                    <div className="space-y-1">
                      {Object.entries(plannedFinancialIncomeByCurrency).map(([currency, amount]) => (
                        <div key={currency} className="flex items-center gap-1">
                          <span className="text-base font-semibold text-amber-600 dark:text-amber-400">
                            {getCurrencySymbol(currency)}{amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">{currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Planned Financial Expenses */}
                {Object.keys(plannedFinancialExpenseByCurrency).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {t("expectedExpensesPlanned")}
                    </p>
                    <div className="space-y-1">
                      {Object.entries(plannedFinancialExpenseByCurrency).map(([currency, amount]) => (
                        <div key={currency} className="flex items-center gap-1">
                          <span className="text-base font-semibold text-amber-600 dark:text-amber-400">
                            -{getCurrencySymbol(currency)}{amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">{currency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Entries List */}
        {dayEntries.length === 0 && financialRecords.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {t("noEntriesForThisDay")}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-1">
                  <Plus className="h-4 w-4" />
                  {t("addEntry")}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setAddDialogOpen(true)}>
                  💼 {t("addShift")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setAddFinancialType('income');
                  setAddFinancialDialogOpen(true);
                }}>
                  💰 {t("addIncome")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setAddFinancialType('expense');
                  setAddFinancialDialogOpen(true);
                }}>
                  💸 {t("addExpense")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (dayEntries.length > 0 || financialRecords.length > 0) && (
          <div className="space-y-3">
            <div className="space-y-2">
              {dayEntries.map((entry) => {
                const hours = entry.actual_hours || 0;
                const status = getStatusInfo(entry.status || "planned");
                const isWorkShift = entry.entry_type === 'work_shift';
                const isDayOff = entry.entry_type === 'day_off';

                // Find income record for this entry
                const incomeRecord = incomeRecords.find(r => r.time_entry_id === entry.id);

                // Calculate display rate based on pay type
                const payType = entry.jobs?.pay_type || 'hourly';
                let rateDisplay = '';
                if (payType === 'daily') {
                  rateDisplay = `${formatCurrency(entry.jobs?.daily_rate || 0)}/day`;
                } else if (payType === 'monthly') {
                  rateDisplay = `${formatCurrency(entry.jobs?.monthly_salary || 0)}/mo`;
                } else if (payType === 'salary') {
                  rateDisplay = `${formatCurrency(entry.jobs?.monthly_salary || 0)}/mo`;
                } else {
                  const hourlyRate = entry.jobs?.hourly_rate || 0;
                  rateDisplay = `${formatCurrency(hourlyRate)}/hr`;
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
                    key={entry.id}
                    onClick={() => handleEntryClick(entry)}
                    className={`w-full border rounded-lg p-3 hover:bg-muted/50 transition-colors text-left ${status.borderColor} ${isDayOff ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left side */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {entry.jobs ? (
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: entry.jobs.color || "#3B82F6" }}
                            />
                          ) : (
                            <div className="w-3 h-3 rounded bg-gray-400" />
                          )}
                          <h4 className="font-semibold text-sm">
                            {entry.jobs?.name || (isDayOff ? t("dayOffLabel") : t("personalTime"))}
                          </h4>
                          <span className="text-xs">{status.emoji}</span>
                        </div>

                        {isDayOff ? (
                          /* Day-off specific display */
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                              <span>{dayOffLabels[entry.day_off_type || 'pto']}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {entry.is_full_day ? t("fullDay") : t("partialDay")} ({formatHours(hours)})
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Work shift display */
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {entry.start_time} - {entry.end_time}
                              </span>
                              <span className="ml-1">({formatHours(entry.actual_hours || 0)})</span>
                            </div>

                            {/* Badges row - overnight and template */}
                            {(entry.is_overnight || entry.shift_templates) && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {entry.is_overnight && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                                    🌙 {t("overnight")}
                                  </span>
                                )}
                                {entry.shift_templates && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                    📋 {entry.shift_templates.short_code || entry.shift_templates.name}
                                  </span>
                                )}
                              </div>
                            )}

                            {entry.jobs && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Coins className="h-3 w-3" />
                                <span>
                                  {getCurrencySymbol(entry.jobs.currency || 'USD')} {rateDisplay}
                                </span>
                              </div>
                            )}

                            {/* Show calculated income for completed shifts - only for calculable pay types */}
                            {incomeRecord && entry.status === 'completed' && (() => {
                              // Only show earned amount if it's calculable per shift (not salary)
                              const isCalculablePayType = entry.jobs ?
                                (entry.jobs.pay_type === 'hourly' || entry.jobs.pay_type === 'daily') :
                                (entry.custom_hourly_rate || entry.custom_daily_rate || entry.holiday_fixed_amount);

                              return isCalculablePayType ? (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                                  <Coins className="h-3 w-3" />
                                  <span>
                                    {t("earned")}: {getCurrencySymbol(incomeRecord.currency)}{incomeRecord.amount.toFixed(2)}
                                  </span>
                                </div>
                              ) : null;
                            })()}

                            {/* Show estimated income for planned/in-progress shifts */}
                            {entry.status !== 'completed' && entry.status !== 'cancelled' && (
                              (() => {
                                const currency = entry.custom_currency || entry.jobs?.currency || 'USD';
                                let estimatedAmount = 0;
                                const hours = entry.actual_hours || entry.scheduled_hours || 0;

                                // Priority 1: Fixed amount
                                if (entry.pay_override_type === 'fixed_amount' && entry.holiday_fixed_amount) {
                                  estimatedAmount = entry.holiday_fixed_amount;
                                }
                                // Priority 2: Custom rates with optional multiplier
                                else if (entry.custom_hourly_rate && hours > 0) {
                                  const multiplier = entry.holiday_multiplier || 1;
                                  estimatedAmount = hours * entry.custom_hourly_rate * multiplier;
                                }
                                else if (entry.custom_daily_rate) {
                                  const multiplier = entry.holiday_multiplier || 1;
                                  estimatedAmount = entry.custom_daily_rate * multiplier;
                                }
                                // Priority 3: Job rates with optional multiplier (ONLY hourly/daily, NOT salary)
                                else if (entry.jobs && (entry.jobs.pay_type === 'hourly' || entry.jobs.pay_type === 'daily')) {
                                  const job = entry.jobs;
                                  const multiplier = entry.holiday_multiplier || 1;

                                  if (job.pay_type === 'hourly' && job.hourly_rate && hours > 0) {
                                    estimatedAmount = hours * job.hourly_rate * multiplier;
                                  } else if (job.pay_type === 'daily' && job.daily_rate) {
                                    estimatedAmount = job.daily_rate * multiplier;
                                  }
                                }

                                return estimatedAmount > 0 ? (
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 mt-1">
                                    <Coins className="h-3 w-3" />
                                    <span>
                                      {t("expected")}: {getCurrencySymbol(currency)}{estimatedAmount.toFixed(2)}
                                    </span>
                                  </div>
                                ) : null;
                              })()
                            )}
                          </div>
                        )}

                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {entry.notes}
                          </p>
                        )}
                      </div>

                      {/* Right side - Status badge */}
                      <div className="text-right">
                        {isDayOff ? (
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {t("timeOff")}
                          </div>
                        ) : (
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatHours(hours)}
                          </div>
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

            {/* Financial Records Section */}
            {financialRecords.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-muted-foreground px-1">{t("financialRecords")}</h4>
                {financialRecords.map((record) => {
                  const isIncome = record.type === 'income';
                  const category = record.financial_categories;
                  const status = record.status || 'completed';
                  const isCancelled = status === 'cancelled';
                  const isPlanned = status === 'planned';
                  const isCompleted = status === 'completed';

                  // Status border color
                  let borderColor = isIncome ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900';
                  if (isCancelled) {
                    borderColor = 'border-gray-300 dark:border-gray-700';
                  } else if (isPlanned) {
                    borderColor = 'border-amber-200 dark:border-amber-900';
                  }

                  return (
                    <button
                      key={record.id}
                      onClick={() => {
                        setSelectedFinancialRecord(record);
                        setEditFinancialDialogOpen(true);
                      }}
                      className={`w-full border rounded-lg p-3 hover:bg-muted/50 transition-colors text-left ${borderColor}`}
                      style={{ opacity: isCancelled ? 0.5 : 1 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isIncome ? (
                              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                            <span className="font-medium text-sm">{record.description}</span>
                            {isPlanned && <span className="text-xs">📅</span>}
                            {isCancelled && <span className="text-xs">❌</span>}
                          </div>

                          {category && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                              <span>{category.icon}</span>
                              <span>{category.name}</span>
                            </div>
                          )}

                          {record.jobs && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                              <div className="w-2 h-2 rounded" style={{ backgroundColor: record.jobs.color || "#3B82F6" }} />
                              <span>{record.jobs.name}</span>
                            </div>
                          )}

                          {record.notes && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {record.notes}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <div className={`text-base font-semibold ${
                            isCancelled ? 'text-gray-400 dark:text-gray-600' :
                            isPlanned ? 'text-amber-600 dark:text-amber-400' :
                            isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {isIncome ? '+' : '-'}{getCurrencySymbol(record.currency)}{Number(record.amount).toFixed(2)}
                          </div>
                          <p className={`text-[10px] ${
                            isCancelled ? 'text-gray-400 dark:text-gray-600' :
                            isPlanned ? 'text-amber-600 dark:text-amber-400' :
                            'text-muted-foreground'
                          }`}>
                            {isPlanned ? t("expected") : isCancelled ? t("cancelled") : t("completed")}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Add Button with Dropdown */}
            <div className="pt-2 border-t flex justify-end pt-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-1">
                    <Plus className="h-4 w-4" />
                    {t("add")}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAddDialogOpen(true)}>
                    💼 {t("addShift")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setAddFinancialType('income');
                    setAddFinancialDialogOpen(true);
                  }}>
                    💰 {t("addIncome")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setAddFinancialType('expense');
                    setAddFinancialDialogOpen(true);
                  }}>
                    💸 {t("addExpense")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      <EditTimeEntryDialog
        entry={selectedEntry}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      <AddTimeEntryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialDate={dateStr}
        onSuccess={handleEditSuccess}
      />

      <EditFinancialRecordDialog
        record={selectedFinancialRecord}
        open={editFinancialDialogOpen}
        onOpenChange={setEditFinancialDialogOpen}
        onSuccess={handleFinancialSuccess}
      />

      <AddFinancialRecordDialog
        open={addFinancialDialogOpen}
        onOpenChange={setAddFinancialDialogOpen}
        selectedDate={date}
        defaultType={addFinancialType}
        onSuccess={handleFinancialSuccess}
      />
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>{formattedDate}</DrawerTitle>
            <DrawerDescription>
              {dayEntries.length} {dayEntries.length === 1 ? t("entry") : t("entries")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formattedDate}</DialogTitle>
          <DialogDescription>
            {dayEntries.length} {dayEntries.length === 1 ? t("entry") : t("entries")}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

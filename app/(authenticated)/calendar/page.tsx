"use client";

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List, ChevronLeft, ChevronRight, Loader2, Plus, ChevronDown } from "lucide-react";
import { MonthCalendar } from "./month-calendar";
import { ListView } from "./list-view";
import { GoToDateDialog } from "./go-to-date-dialog";
import { IncomeStatsCards } from "./income-stats-cards";
import { StatCardMobile } from "./stat-card";
import { useTimeEntries } from "@/lib/hooks/use-time-entries";
import { useIncomeRecords } from "@/lib/hooks/use-income-records";
import { useFinancialRecords } from "@/lib/hooks/use-financial-records";
import { usePrefetch } from "@/lib/hooks/use-prefetch";
import { Database } from "@/lib/database.types";
import { getCurrencySymbol, formatHours, formatCurrency } from "@/lib/utils/time-format";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { usePrimaryCurrency } from "@/lib/hooks/use-user-settings";

// Code splitting: Lazy load heavy dialogs (~800 lines each)
// These only load when user actually opens them, reducing initial bundle size
const AddTimeEntryDialog = lazy(() =>
  import("./add-time-entry-dialog").then((mod) => ({ default: mod.AddTimeEntryDialog }))
);
const AddFinancialRecordDialog = lazy(() =>
  import("../finances/add-financial-record-dialog").then((mod) => ({ default: mod.AddFinancialRecordDialog }))
);
const DayShiftsDrawer = lazy(() =>
  import("./day-shifts-drawer").then((mod) => ({ default: mod.DayShiftsDrawer }))
);

type ViewMode = "calendar" | "list";
type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
  shift_templates: Database["public"]["Tables"]["shift_templates"]["Row"] | null;
};

type FinancialRecord = Database["public"]["Tables"]["financial_records"]["Row"] & {
  financial_categories?: Database["public"]["Tables"]["financial_categories"]["Row"] | null;
  jobs?: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

export default function CalendarPage() {
  const { t, formatDate } = useTranslation();
  const primaryCurrency = usePrimaryCurrency();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFinancialDialogOpen, setAddFinancialDialogOpen] = useState(false);
  const [addFinancialType, setAddFinancialType] = useState<"income" | "expense">("income");
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Initialize current date on client side only
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Calculate date range for current month
  const { startDate, endDate } = useMemo(() => {
    if (!currentDate) return { startDate: "", endDate: "" };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      startDate: `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`,
      endDate: `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`,
    };
  }, [currentDate]);

  // Use React Query hooks for data fetching
  const { data: entries = [], isLoading: isLoadingEntries } = useTimeEntries(startDate, endDate);
  const { data: incomeRecords = [], isLoading: isLoadingIncome } = useIncomeRecords(startDate, endDate);
  const { data: financialRecords = [], isLoading: isLoadingFinancial } = useFinancialRecords(startDate, endDate);

  const loading = isLoadingEntries || isLoadingIncome || isLoadingFinancial;

  const prefetch = usePrefetch();

  // Navigate months - useCallback prevents re-creating these functions on every render
  const goToPreviousMonth = useCallback(() => {
    if (!currentDate) return;
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    setCurrentDate(prevMonth);

    // Prefetch data for previous month for instant navigation
    const year = prevMonth.getFullYear();
    const month = prevMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const start = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
    const end = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    prefetch.timeEntries(start, end);
    prefetch.incomeRecords(start, end);
    prefetch.financialRecords(start, end);
  }, [currentDate, prefetch]);

  const goToNextMonth = useCallback(() => {
    if (!currentDate) return;
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    setCurrentDate(nextMonth);

    // Prefetch data for next month
    const year = nextMonth.getFullYear();
    const month = nextMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const start = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
    const end = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    prefetch.timeEntries(start, end);
    prefetch.incomeRecords(start, end);
    prefetch.financialRecords(start, end);
  }, [currentDate, prefetch]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const monthYear = currentDate ? formatDate(currentDate, {
    month: "long",
    year: true,
  }) : "";

  // Calculate stats from loaded data using useMemo for performance
  const stats = useMemo(() => {
    const timeEntries = entries as TimeEntry[];

    // Calculate hours
    const completedEntries = timeEntries.filter(e => e.status === 'completed');
    const totalActualHours = completedEntries.reduce((sum, e) => sum + (e.actual_hours || 0), 0);
    const totalScheduledHours = timeEntries.filter(e => e.status !== 'cancelled').reduce((sum, e) => sum + (e.scheduled_hours || 0), 0);
    const completedShifts = completedEntries.length;
    const plannedShifts = timeEntries.filter(e => e.status === 'planned').length;
    const inProgressShifts = timeEntries.filter(e => e.status === 'in_progress').length;

    // Calculate shift income by currency from income_records (completed shifts)
    const shiftIncomeByCurrency: Record<string, number> = {};
    incomeRecords.forEach(record => {
      // CRITICAL: Only add to aggregation if currency is set
      if (!record.currency) {
        console.warn('WARNING: Income record has no currency, skipping:', record.id);
        return;
      }
      const currency = record.currency;
      shiftIncomeByCurrency[currency] = (shiftIncomeByCurrency[currency] || 0) + record.amount;
    });

    // Calculate expected income from planned/in-progress shifts
    const expectedShiftIncomeByCurrency: Record<string, number> = {};
    timeEntries.filter(e => e.status === 'planned' || e.status === 'in_progress').forEach(entry => {
      let currency: string | null = null;
      let expectedIncome = 0;

      // Determine currency: custom_currency > job.currency > skip
      if (entry.custom_currency) {
        currency = entry.custom_currency;
      } else if (entry.jobs?.currency) {
        currency = entry.jobs.currency;
      } else {
        // No currency available, skip this entry
        return;
      }

      const job = entry.jobs;

      // Calculate expected income based on pay type and override
      if (entry.pay_override_type && entry.pay_override_type !== 'default' && entry.pay_override_type !== 'none') {
        // Use override values
        if (entry.pay_override_type === 'custom_hourly' && entry.custom_hourly_rate) {
          expectedIncome = entry.custom_hourly_rate * (entry.scheduled_hours || 0);
        } else if (entry.pay_override_type === 'custom_daily' && entry.custom_daily_rate) {
          expectedIncome = entry.custom_daily_rate;
        } else if (entry.pay_override_type === 'fixed_amount' && entry.holiday_fixed_amount) {
          expectedIncome = entry.holiday_fixed_amount;
        } else if (entry.pay_override_type === 'holiday_multiplier' && entry.holiday_multiplier) {
          // Calculate base amount from job rates, then apply multiplier
          let baseAmount = 0;
          if (job?.pay_type === 'hourly' && job.hourly_rate) {
            baseAmount = job.hourly_rate * (entry.scheduled_hours || 0);
          } else if (job?.pay_type === 'daily' && job.daily_rate) {
            baseAmount = job.daily_rate;
          }
          expectedIncome = baseAmount * entry.holiday_multiplier;
        }
      } else if (job) {
        // Use job rates (only if job exists)
        if (job.pay_type === 'hourly' && job.hourly_rate) {
          expectedIncome = job.hourly_rate * (entry.scheduled_hours || 0);
        } else if (job.pay_type === 'daily' && job.daily_rate) {
          expectedIncome = job.daily_rate;
        }
      }

      if (expectedIncome > 0 && currency) {
        expectedShiftIncomeByCurrency[currency] = (expectedShiftIncomeByCurrency[currency] || 0) + expectedIncome;
      }
    });

    // Calculate financial records income/expense by currency
    const financialIncomeByCurrency: Record<string, number> = {};
    const financialExpenseByCurrency: Record<string, number> = {};
    const expectedFinancialIncomeByCurrency: Record<string, number> = {};
    const expectedFinancialExpenseByCurrency: Record<string, number> = {};

    financialRecords.forEach(record => {
      // CRITICAL: Only add to aggregation if currency is set
      if (!record.currency) {
        console.warn('WARNING: Financial record has no currency, skipping:', record.id);
        return;
      }
      const currency = record.currency;
      const amount = Number(record.amount);

      if (record.status === 'completed') {
        if (record.type === 'income') {
          financialIncomeByCurrency[currency] = (financialIncomeByCurrency[currency] || 0) + amount;
        } else if (record.type === 'expense') {
          financialExpenseByCurrency[currency] = (financialExpenseByCurrency[currency] || 0) + amount;
        }
      } else if (record.status === 'planned') {
        if (record.type === 'income') {
          expectedFinancialIncomeByCurrency[currency] = (expectedFinancialIncomeByCurrency[currency] || 0) + amount;
        } else if (record.type === 'expense') {
          expectedFinancialExpenseByCurrency[currency] = (expectedFinancialExpenseByCurrency[currency] || 0) + amount;
        }
      }
    });

    // Calculate net income (shift + other - expenses) by currency
    const earningsByCurrency: Record<string, number> = {};
    Object.entries(shiftIncomeByCurrency).forEach(([currency, amount]) => {
      earningsByCurrency[currency] = (earningsByCurrency[currency] || 0) + amount;
    });
    Object.entries(financialIncomeByCurrency).forEach(([currency, amount]) => {
      earningsByCurrency[currency] = (earningsByCurrency[currency] || 0) + amount;
    });
    Object.entries(financialExpenseByCurrency).forEach(([currency, amount]) => {
      earningsByCurrency[currency] = (earningsByCurrency[currency] || 0) - amount;
    });

    return {
      totalHours: totalActualHours,
      shiftCount: timeEntries.length,
      totalActualHours,
      totalScheduledHours,
      completedShifts,
      plannedShifts,
      inProgressShifts,
      shiftIncomeByCurrency,
      expectedShiftIncomeByCurrency,
      expectedFinancialIncomeByCurrency,
      expectedFinancialExpenseByCurrency,
      financialIncomeByCurrency,
      financialExpenseByCurrency,
      earningsByCurrency, // Net income (shift + other - expenses)
    };
  }, [entries, incomeRecords, financialRecords]);

  // React Query automatically handles data refetching via cache invalidation
  const handleEntryChange = () => {
    // No manual refresh needed - mutations handle cache invalidation
  };

  const handleFinancialSuccess = () => {
    // No manual refresh needed - mutations handle cache invalidation
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDayDrawerOpen(true);
  };

  return (
    <div className="h-full overflow-hidden flex flex-col px-4 py-3 md:p-6 gap-4 lg:gap-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex justify-between items-center gap-2 mb-0 flex-shrink-0" suppressHydrationWarning>
        <h1 className="text-xl md:text-3xl font-bold">{t("calendar")}</h1>

        {/* View Toggle and Add Button */}
        <div className="flex items-center gap-1.5">
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{t("calendar")}</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{t("list")}</span>
          </Button>
          <Button size="sm" className="gap-1" onClick={() => setShowAddMenu(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">{t("add")}</span>
          </Button>
        </div>
      </div>

      {/* Add Time Entry Dialog - Lazy loaded */}
      <Suspense fallback={null}>
        <AddTimeEntryDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={handleEntryChange}
        />
      </Suspense>

      {/* Add Financial Record Dialog - Lazy loaded */}
      <Suspense fallback={null}>
        <AddFinancialRecordDialog
          open={addFinancialDialogOpen}
          onOpenChange={setAddFinancialDialogOpen}
          selectedDate={currentDate || undefined}
          defaultType={addFinancialType}
          onSuccess={handleFinancialSuccess}
        />
      </Suspense>

      {/* Add Menu Dialog */}
      <Dialog open={showAddMenu} onOpenChange={setShowAddMenu}>
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="p-4 sm:p-6 pb-2">
            <DialogTitle>{t("addNew")}</DialogTitle>
            <DialogDescription>{t("whatWouldYouLikeToAdd")}</DialogDescription>
          </DialogHeader>
          <div className="p-4 sm:p-6 pt-2 space-y-3">
            <button
              onClick={() => {
                setShowAddMenu(false);
                setAddDialogOpen(true);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
            >
              <div className="text-3xl">💼</div>
              <div>
                <p className="font-semibold">{t("addShift")}</p>
                <p className="text-sm text-muted-foreground">{t("logWorkShiftOrDayOff")}</p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowAddMenu(false);
                setAddFinancialType('income');
                setAddFinancialDialogOpen(true);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
            >
              <div className="text-3xl">💰</div>
              <div>
                <p className="font-semibold">{t("addIncome")}</p>
                <p className="text-sm text-muted-foreground">{t("recordIncomePayment")}</p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowAddMenu(false);
                setAddFinancialType('expense');
                setAddFinancialDialogOpen(true);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
            >
              <div className="text-3xl">💸</div>
              <div>
                <p className="font-semibold">{t("addExpense")}</p>
                <p className="text-sm text-muted-foreground">{t("trackSpendingExpense")}</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards - Mobile Only */}
      <div className="lg:hidden mb-0 flex-shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {/* Net Income Card */}
          <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">💵 {t("netIncome")}</p>
            {loading ? (
              <div className="flex items-center justify-center py-1">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
              </div>
            ) : Object.keys(stats.earningsByCurrency).length > 1 ? (
              <div className="space-y-0.5">
                {Object.entries(stats.earningsByCurrency).map(([currency, amount]) => (
                  <p key={currency} className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {getCurrencySymbol(currency)} {formatCurrency(amount)}
                  </p>
                ))}
              </div>
            ) : Object.keys(stats.earningsByCurrency).length === 1 ? (
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                {(() => {
                  const [currency, amount] = Object.entries(stats.earningsByCurrency)[0];
                  return `${getCurrencySymbol(currency)} ${formatCurrency(amount)}`;
                })()}
              </p>
            ) : (
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                {getCurrencySymbol(primaryCurrency)}{formatCurrency(0)}
              </p>
            )}
          </div>

          {/* Expenses Card */}
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">💸 {t("expenses")}</p>
            {loading ? (
              <div className="flex items-center justify-center py-1">
                <Loader2 className="h-4 w-4 animate-spin text-red-600 dark:text-red-400" />
              </div>
            ) : Object.keys(stats.financialExpenseByCurrency).length > 1 ? (
              <div className="space-y-0.5">
                {Object.entries(stats.financialExpenseByCurrency).map(([currency, amount]) => (
                  <p key={currency} className="text-xs font-bold text-red-600 dark:text-red-400">
                    -{getCurrencySymbol(currency)} {formatCurrency(amount)}
                  </p>
                ))}
              </div>
            ) : Object.keys(stats.financialExpenseByCurrency).length === 1 ? (
              <p className="text-base font-bold text-red-600 dark:text-red-400">
                {(() => {
                  const [currency, amount] = Object.entries(stats.financialExpenseByCurrency)[0];
                  return `-${getCurrencySymbol(currency)} ${formatCurrency(amount)}`;
                })()}
              </p>
            ) : (
              <p className="text-base font-bold text-red-600 dark:text-red-400">
                -{getCurrencySymbol(primaryCurrency)}{formatCurrency(0)}
              </p>
            )}
          </div>

          {/* Expected Income (Total from all sources) Card */}
          <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">📅 {t("expectedIncome")}</p>
            {loading ? (
              <div className="flex items-center justify-center py-1">
                <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
              </div>
            ) : (() => {
              // Calculate total expected income by combining shift + financial income
              const totalExpectedByCurrency: Record<string, number> = {};
              Object.entries(stats.expectedShiftIncomeByCurrency).forEach(([currency, amount]) => {
                totalExpectedByCurrency[currency] = (totalExpectedByCurrency[currency] || 0) + amount;
              });
              Object.entries(stats.expectedFinancialIncomeByCurrency).forEach(([currency, amount]) => {
                totalExpectedByCurrency[currency] = (totalExpectedByCurrency[currency] || 0) + amount;
              });

              return Object.keys(totalExpectedByCurrency).length > 1 ? (
                <div className="space-y-0.5">
                  {Object.entries(totalExpectedByCurrency).map(([currency, amount]) => (
                    <p key={currency} className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {getCurrencySymbol(currency)} {formatCurrency(amount)}
                    </p>
                  ))}
                </div>
              ) : Object.keys(totalExpectedByCurrency).length === 1 ? (
                <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {(() => {
                    const [currency, amount] = Object.entries(totalExpectedByCurrency)[0];
                    return `${getCurrencySymbol(currency)} ${formatCurrency(amount)}`;
                  })()}
                </p>
              ) : (
                <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {getCurrencySymbol(primaryCurrency)}{formatCurrency(0)}
                </p>
              );
            })()}
          </div>
        </div>

        {/* View Detailed Stats Button */}
        <button
          onClick={() => setShowDetailedStats(true)}
          className="mt-2 w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t"
        >
          {t("viewDetailedStats")}
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[1fr_300px] lg:gap-4 overflow-hidden">
        {/* Calendar Section */}
        <div className="flex flex-col h-full min-h-0">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base md:text-xl font-semibold min-w-[140px] md:min-w-[180px] text-center">
                {monthYear}
              </h2>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {currentDate && (
                <GoToDateDialog currentDate={currentDate} onDateChange={goToDate} />
              )}
              <Button variant="outline" size="sm" onClick={goToToday} className="hidden md:inline-flex">
                {t("today")}
              </Button>
            </div>
          </div>

          {/* Calendar/List View */}
          <div className="border rounded-lg p-3 md:p-6 flex-1 min-h-0 overflow-y-auto">
            {viewMode === "calendar" ? (
              currentDate ? (
                <MonthCalendar
                  currentDate={currentDate}
                  entries={entries}
                  financialRecords={financialRecords}
                  onDayClick={handleDayClick}
                />
              ) : null
            ) : (
              <ListView
                entries={entries}
                financialRecords={financialRecords}
                loading={loading}
                onEntryChange={handleEntryChange}
              />
            )}
          </div>
        </div>

        {/* Stats Sidebar - Desktop Only */}
        <div className="hidden lg:flex lg:flex-col gap-3 overflow-y-auto min-h-0">
          {currentDate && (
            <IncomeStatsCards
              shiftIncomeByCurrency={stats.shiftIncomeByCurrency}
              expectedShiftIncomeByCurrency={stats.expectedShiftIncomeByCurrency}
              financialIncomeByCurrency={stats.financialIncomeByCurrency}
              financialExpenseByCurrency={stats.financialExpenseByCurrency}
              expectedFinancialIncomeByCurrency={stats.expectedFinancialIncomeByCurrency}
              expectedFinancialExpenseByCurrency={stats.expectedFinancialExpenseByCurrency}
              loading={loading}
            />
          )}

          {/* Hours and Shifts Cards in two columns */}
          <div className="grid gap-2.5 lg:grid-cols-2">
            {/* Hours Card */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1.5">{"⏱️ " + t("hours")}</p>
              {loading ? (
                <div className="flex items-center justify-center py-1.5">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              ) : (
                <>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatHours(stats.totalActualHours)}
                  </div>
                  {stats.totalScheduledHours > 0 && stats.totalScheduledHours !== stats.totalActualHours && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      of {formatHours(stats.totalScheduledHours)}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Shifts Card */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1.5">📅 Shifts</p>
              {loading ? (
                <div className="flex items-center justify-center py-1.5">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-400" />
                </div>
              ) : (
                <>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.shiftCount}
                  </div>
                  {(stats.completedShifts > 0 || stats.plannedShifts > 0 || stats.inProgressShifts > 0) && (
                    <div className="mt-1.5 space-y-0.5">
                      {stats.completedShifts > 0 && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{t("done")}:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">{stats.completedShifts}</span>
                        </div>
                      )}
                      {stats.inProgressShifts > 0 && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{t("active")}:</span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">{stats.inProgressShifts}</span>
                        </div>
                      )}
                      {stats.plannedShifts > 0 && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{t("plan")}:</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">{stats.plannedShifts}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Day Shifts Drawer - Lazy loaded */}
      <Suspense fallback={null}>
        <DayShiftsDrawer
          date={selectedDate}
          entries={entries}
          open={dayDrawerOpen}
          onOpenChange={setDayDrawerOpen}
          onEntryChange={handleEntryChange}
        />
      </Suspense>

      {/* Detailed Stats Drawer - Mobile Only */}
      <Drawer open={showDetailedStats} onOpenChange={setShowDetailedStats}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>{t("monthlyStatsDetails")}</DrawerTitle>
          </DrawerHeader>

          <div className="overflow-y-auto p-4 space-y-3">
            {/* Shift Income (Completed) */}
            {Object.keys(stats.shiftIncomeByCurrency).length > 0 && (
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  💼 {t("shiftIncome")} ({t("completed")})
                </p>
                <div className="space-y-2">
                  {Object.entries(stats.shiftIncomeByCurrency).map(([currency, amount]) => (
                    <div key={currency} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{currency}</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {getCurrencySymbol(currency)}{formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Shift Income (Planned/In Progress) */}
            {Object.keys(stats.expectedShiftIncomeByCurrency).length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  📅 {t("expectedIncome")} ({t("planned")}/{t("inProgress")})
                </p>
                <div className="space-y-2">
                  {Object.entries(stats.expectedShiftIncomeByCurrency).map(([currency, amount]) => (
                    <div key={currency} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{currency}</span>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {getCurrencySymbol(currency)}{formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expected Other Income (Planned) */}
            {Object.keys(stats.expectedFinancialIncomeByCurrency).length > 0 && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  📊 {t("expectedOtherIncome")} ({t("planned")})
                </p>
                <div className="space-y-2">
                  {Object.entries(stats.expectedFinancialIncomeByCurrency).map(([currency, amount]) => (
                    <div key={currency} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{currency}</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {getCurrencySymbol(currency)}{formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Income */}
            {(() => {
              const completedFinancialIncome: Record<string, number> = {};
              financialRecords.filter(r => r.type === 'income' && r.status === 'completed').forEach(record => {
                const currency = record.currency || 'USD';
                completedFinancialIncome[currency] = (completedFinancialIncome[currency] || 0) + Number(record.amount);
              });

              return Object.keys(completedFinancialIncome).length > 0 ? (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t("otherIncome")}
                  </p>
                  <div className="space-y-2">
                    {Object.entries(completedFinancialIncome).map(([currency, amount]) => (
                      <div key={currency} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{currency}</span>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          {getCurrencySymbol(currency)}{formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Expenses */}
            {(() => {
              const completedExpenses: Record<string, number> = {};
              financialRecords.filter(r => r.type === 'expense' && r.status === 'completed').forEach(record => {
                const currency = record.currency || 'USD';
                completedExpenses[currency] = (completedExpenses[currency] || 0) + Number(record.amount);
              });

              return Object.keys(completedExpenses).length > 0 ? (
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    {t("expenses")}
                  </p>
                  <div className="space-y-2">
                    {Object.entries(completedExpenses).map(([currency, amount]) => (
                      <div key={currency} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{currency}</span>
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          -{getCurrencySymbol(currency)}{formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Expected Expenses (Planned) */}
            {Object.keys(stats.expectedFinancialExpenseByCurrency).length > 0 && (
              <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  📉 {t("expectedExpenses")} ({t("planned")})
                </p>
                <div className="space-y-2">
                  {Object.entries(stats.expectedFinancialExpenseByCurrency).map(([currency, amount]) => (
                    <div key={currency} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{currency}</span>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        -{getCurrencySymbol(currency)}{formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Net Income */}
            {Object.keys(stats.earningsByCurrency).length > 0 && (
              <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3">{"💵 " + t("netIncome")}</p>
                <div className="space-y-2">
                  {Object.entries(stats.earningsByCurrency).map(([currency, amount]) => (
                    <div key={currency} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{currency}</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {getCurrencySymbol(currency)}{formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Breakdown */}
            {stats.shiftCount > 0 && (
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3">{"📊 " + t("statusBreakdown")}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("completed")}</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completedShifts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("inProgress")}</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.inProgressShifts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("planned")}</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.plannedShifts}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Hours Breakdown */}
            {stats.totalActualHours > 0 && (
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3">{"⏱️ " + t("hours")}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("actualWorked")}</span>
                    <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                      {formatHours(stats.totalActualHours)}
                    </span>
                  </div>
                  {stats.totalScheduledHours > 0 && stats.totalScheduledHours !== stats.totalActualHours && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("scheduled")}</span>
                      <span className="text-base font-medium text-muted-foreground">
                        {formatHours(stats.totalScheduledHours)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

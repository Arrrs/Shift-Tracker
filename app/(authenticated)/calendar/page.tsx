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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";

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
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFinancialDialogOpen, setAddFinancialDialogOpen] = useState(false);
  const [addFinancialType, setAddFinancialType] = useState<"income" | "expense">("income");
  const [showDetailedStats, setShowDetailedStats] = useState(false);

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

  const monthYear = currentDate?.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }) || "";

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
      const currency = record.currency || 'USD';
      shiftIncomeByCurrency[currency] = (shiftIncomeByCurrency[currency] || 0) + record.amount;
    });

    // Calculate expected income from planned/in-progress shifts
    const expectedShiftIncomeByCurrency: Record<string, number> = {};
    timeEntries.filter(e => e.status === 'planned' || e.status === 'in_progress').forEach(entry => {
      if (!entry.jobs) return;

      const job = entry.jobs;
      const currency = job.currency || 'USD';
      let expectedIncome = 0;

      // Calculate expected income based on pay type and override
      if (entry.pay_override_type && entry.pay_override_type !== 'default' && entry.pay_override_type !== 'none') {
        // Use override values
        if (entry.pay_override_type === 'custom_hourly' && entry.custom_hourly_rate) {
          expectedIncome = entry.custom_hourly_rate * (entry.scheduled_hours || 0);
        } else if (entry.pay_override_type === 'custom_daily' && entry.custom_daily_rate) {
          expectedIncome = entry.custom_daily_rate;
        }
      } else {
        // Use job rates
        if (job.pay_type === 'hourly' && job.hourly_rate) {
          expectedIncome = job.hourly_rate * (entry.scheduled_hours || 0);
        } else if (job.pay_type === 'daily' && job.daily_rate) {
          expectedIncome = job.daily_rate;
        }
      }

      if (expectedIncome > 0) {
        expectedShiftIncomeByCurrency[currency] = (expectedShiftIncomeByCurrency[currency] || 0) + expectedIncome;
      }
    });

    // Calculate financial records income/expense by currency (completed only)
    const financialIncomeByCurrency: Record<string, number> = {};
    const financialExpenseByCurrency: Record<string, number> = {};
    financialRecords.forEach(record => {
      if (record.status === 'completed') {
        const currency = record.currency || 'USD';
        if (record.type === 'income') {
          financialIncomeByCurrency[currency] = (financialIncomeByCurrency[currency] || 0) + Number(record.amount);
        } else if (record.type === 'expense') {
          financialExpenseByCurrency[currency] = (financialExpenseByCurrency[currency] || 0) + Number(record.amount);
        }
      }
    });

    // Calculate totals for each income type
    const totalShiftIncome = Object.values(shiftIncomeByCurrency).reduce((sum, amount) => sum + amount, 0);
    const totalOtherIncome = Object.values(financialIncomeByCurrency).reduce((sum, amount) => sum + amount, 0);
    const totalExpectedShiftIncome = Object.values(expectedShiftIncomeByCurrency).reduce((sum, amount) => sum + amount, 0);

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
      totalShiftIncome,
      totalOtherIncome,
      totalExpectedShiftIncome,
      totalHours: totalActualHours,
      shiftCount: timeEntries.length,
      totalActualHours,
      totalScheduledHours,
      completedShifts,
      plannedShifts,
      inProgressShifts,
      shiftIncomeByCurrency,
      expectedShiftIncomeByCurrency,
      financialIncomeByCurrency,
      financialExpenseByCurrency,
      earningsByCurrency, // Net income (shift + other - expenses)
      shiftIncomeByJob: [], // TODO: Calculate if needed
      fixedIncomeJobIds: [],
      fixedIncomeShiftCounts: {},
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">{t("add")}</span>
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

      {/* Stats Cards - Mobile Only */}
      <div className="lg:hidden mb-0 flex-shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {/* Shift Income Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">💼 {t("shiftIncome")}</p>
            {loading ? (
              <div className="flex items-center justify-center py-1">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : Object.keys(stats.shiftIncomeByCurrency).length > 1 ? (
              <div className="space-y-0.5">
                {Object.entries(stats.shiftIncomeByCurrency).map(([currency, amount]) => (
                  <p key={currency} className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {getCurrencySymbol(currency)} {formatCurrency(amount)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {getCurrencySymbol(Object.keys(stats.shiftIncomeByCurrency)[0] || 'USD')} {formatCurrency(stats.totalShiftIncome)}
              </p>
            )}
          </div>

          {/* Other Income Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-lime-500/10 border border-green-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">💵 {t("otherIncome")}</p>
            {loading ? (
              <div className="flex items-center justify-center py-1">
                <Loader2 className="h-4 w-4 animate-spin text-green-600 dark:text-green-400" />
              </div>
            ) : Object.keys(stats.financialIncomeByCurrency).length > 1 ? (
              <div className="space-y-0.5">
                {Object.entries(stats.financialIncomeByCurrency).map(([currency, amount]) => (
                  <p key={currency} className="text-xs font-bold text-green-600 dark:text-green-400">
                    {getCurrencySymbol(currency)} {formatCurrency(amount)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                {getCurrencySymbol(Object.keys(stats.financialIncomeByCurrency)[0] || 'USD')} {formatCurrency(stats.totalOtherIncome)}
              </p>
            )}
          </div>

          {/* Hours Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">⏰ {t("hours")}</p>
            {loading ? (
              <div className="flex items-center justify-center py-1">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            ) : (
              <>
                <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {formatHours(stats.totalActualHours)}
                </p>
                {stats.totalScheduledHours > 0 && stats.totalScheduledHours !== stats.totalActualHours && (
                  <p className="text-[8px] text-muted-foreground">
                    of {formatHours(stats.totalScheduledHours)}
                  </p>
                )}
              </>
            )}
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
              currentDate={currentDate}
              shiftIncomeByCurrency={stats.shiftIncomeByCurrency}
              shiftIncomeByJob={stats.shiftIncomeByJob}
              fixedIncomeJobIds={stats.fixedIncomeJobIds}
              fixedIncomeShiftCounts={stats.fixedIncomeShiftCounts}
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

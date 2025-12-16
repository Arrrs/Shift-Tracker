"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List, ChevronLeft, ChevronRight, Loader2, Plus, ChevronDown } from "lucide-react";
import { MonthCalendar } from "./month-calendar";
import { ListView } from "./list-view";
import { AddTimeEntryDialog } from "./add-time-entry-dialog";
import { AddFinancialRecordDialog } from "../finances/add-financial-record-dialog";
import { GoToDateDialog } from "./go-to-date-dialog";
import { DayShiftsDrawer } from "./day-shifts-drawer";
import { IncomeStatsCards } from "./income-stats-cards";
import { StatCardMobile } from "./stat-card";
import { getTimeEntries } from "../time-entries/actions";
import { getFinancialRecords } from "../finances/actions";
import { Database } from "@/lib/database.types";
import { getCurrencySymbol, formatHours, formatCurrency } from "@/lib/utils/time-format";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalHours: 0,
    shiftCount: 0,
    totalActualHours: 0,
    totalScheduledHours: 0,
    completedShifts: 0,
    plannedShifts: 0,
    inProgressShifts: 0,
    earningsByCurrency: {} as Record<string, number>,
    shiftIncomeByCurrency: {} as Record<string, number>,
    shiftIncomeByJob: [] as Array<{jobId: string; jobName: string; amount: number; hours: number; shifts: number}>,
    fixedIncomeJobIds: [] as string[],
    fixedIncomeShiftCounts: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFinancialDialogOpen, setAddFinancialDialogOpen] = useState(false);
  const [addFinancialType, setAddFinancialType] = useState<"income" | "expense">("income");

  // Initialize current date on client side only
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Navigate months
  const goToPreviousMonth = () => {
    if (!currentDate) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    if (!currentDate) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToDate = (date: Date) => {
    setCurrentDate(date);
  };

  const monthYear = currentDate?.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }) || "";

  // Load shifts and stats for current month
  useEffect(() => {
    if (!currentDate) return;

    const loadData = async () => {
      setLoading(true);

      // Get first and last day of current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const startDate = firstDay.toISOString().split("T")[0];
      const endDate = lastDay.toISOString().split("T")[0];

      // Load time entries
      const entriesResult = await getTimeEntries(startDate, endDate);
      if (entriesResult.entries) {
        setEntries(entriesResult.entries as TimeEntry[]);
      }

      // Load financial records
      const financialResult = await getFinancialRecords(startDate, endDate);
      if (financialResult.records) {
        setFinancialRecords(financialResult.records as FinancialRecord[]);
      }

      // TODO: Load stats from new schema
      // const statsResult = await getTimeEntryStats(startDate, endDate);
      // if (statsResult.stats) {
      //   setStats({
      //     ...statsResult.stats,
      //     earningsByCurrency: statsResult.stats.shiftIncomeByCurrency,
      //   });
      // }

      setLoading(false);
    };

    loadData();
  }, [currentDate, refreshTrigger]);

  const handleEntryChange = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleFinancialSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDayDrawerOpen(true);
  };

  return (
    <div className="h-full overflow-hidden flex flex-col px-4 py-3 md:p-6 gap-4 lg:gap-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex justify-between items-center gap-2 mb-0 flex-shrink-0" suppressHydrationWarning>
        <h1 className="text-xl md:text-3xl font-bold">Calendar</h1>

        {/* View Toggle and Add Button */}
        <div className="flex items-center gap-1.5">
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Calendar</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">List</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Add</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAddDialogOpen(true)}>
                💼 Add Shift
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setAddFinancialType('income');
                setAddFinancialDialogOpen(true);
              }}>
                💰 Add Income
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setAddFinancialType('expense');
                setAddFinancialDialogOpen(true);
              }}>
                💸 Add Expense
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Add Time Entry Dialog */}
      <AddTimeEntryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleEntryChange}
      />

      {/* Add Financial Record Dialog */}
      <AddFinancialRecordDialog
        open={addFinancialDialogOpen}
        onOpenChange={setAddFinancialDialogOpen}
        selectedDate={currentDate || undefined}
        defaultType={addFinancialType}
        onSuccess={handleFinancialSuccess}
      />

      {/* Stats Cards - Mobile Only */}
      <div className="lg:hidden mb-3 flex-shrink-0">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Earnings</p>
            {loading ? (
              <div className="flex items-center justify-center py-1">
                <Loader2 className="h-4 w-4 animate-spin text-green-600 dark:text-green-400" />
              </div>
            ) : Object.keys(stats.earningsByCurrency).length > 1 ? (
              <div className="space-y-0.5">
                {Object.entries(stats.earningsByCurrency).map(([currency, amount]) => (
                  <p key={currency} className="text-xs font-bold text-green-600 dark:text-green-400">
                    {getCurrencySymbol(currency)} {formatCurrency(amount)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                {getCurrencySymbol(Object.keys(stats.earningsByCurrency)[0] || 'USD')} {formatCurrency(stats.totalEarnings)}
              </p>
            )}
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Hours</p>
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
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Shifts</p>
            {loading ? (
              <div className="flex items-center justify-center py-1">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-400" />
              </div>
            ) : (
              <>
                <p className="text-base font-bold text-purple-600 dark:text-purple-400">
                  {stats.shiftCount}
                </p>
                {stats.completedShifts > 0 && stats.shiftCount !== stats.completedShifts && (
                  <p className="text-[8px] text-muted-foreground">
                    {stats.completedShifts} done
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 overflow-hidden">
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
                Today
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
        <div className="hidden lg:flex lg:flex-col">
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
        </div>
      </div>

      {/* Day Shifts Drawer */}
      <DayShiftsDrawer
        date={selectedDate}
        entries={entries}
        open={dayDrawerOpen}
        onOpenChange={setDayDrawerOpen}
        onEntryChange={handleEntryChange}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { MonthCalendar } from "./month-calendar";
import { ListView } from "./list-view";
import { AddShiftDialog } from "./add-shift-dialog";
import { GoToDateDialog } from "./go-to-date-dialog";
import { DayShiftsDrawer } from "./day-shifts-drawer";
import { IncomeStatsCards } from "./income-stats-cards";
import { StatCardMobile } from "./stat-card";
import { getShifts, getShiftStats } from "./actions";
import { Database } from "@/lib/database.types";
import { getCurrencySymbol, formatHours, formatCurrency } from "@/lib/utils/time-format";

type ViewMode = "calendar" | "list";
type Shift = Database["public"]["Tables"]["shifts"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
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

      // Load shifts
      const shiftsResult = await getShifts(startDate, endDate);
      if (shiftsResult.shifts) {
        setShifts(shiftsResult.shifts as Shift[]);
      }

      // Load stats
      const statsResult = await getShiftStats(startDate, endDate);
      if (statsResult.stats) {
        setStats({
          ...statsResult.stats,
          earningsByCurrency: statsResult.stats.shiftIncomeByCurrency, // Keep for backward compatibility
        });
      }

      setLoading(false);
    };

    loadData();
  }, [currentDate, refreshTrigger]);

  const handleShiftChange = () => {
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
          <AddShiftDialog onSuccess={handleShiftChange} />
        </div>
      </div>

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
      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
        {/* Calendar Section */}
        <div className="flex flex-col h-full">
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
                  shifts={shifts}
                  onDayClick={handleDayClick}
                />
              ) : null
            ) : (
              <ListView
                shifts={shifts}
                loading={loading}
                onShiftChange={handleShiftChange}
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
        shifts={shifts}
        open={dayDrawerOpen}
        onOpenChange={setDayDrawerOpen}
        onShiftChange={handleShiftChange}
      />
    </div>
  );
}

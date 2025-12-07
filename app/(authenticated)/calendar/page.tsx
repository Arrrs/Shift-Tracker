"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List, ChevronLeft, ChevronRight } from "lucide-react";
import { MonthCalendar } from "./month-calendar";
import { ListView } from "./list-view";
import { AddShiftDialog } from "./add-shift-dialog";
import { GoToDateDialog } from "./go-to-date-dialog";
import { DayShiftsDrawer } from "./day-shifts-drawer";
import { getShifts, getShiftStats } from "./actions";
import { Database } from "@/lib/database.types";

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
        setStats(statsResult.stats);
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
    <div className="h-full overflow-hidden flex flex-col px-4 py-3 md:p-6 gap-4 lg:gap-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-2 mb-0 flex-shrink-0">
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
              <p className="text-base font-bold text-green-600 dark:text-green-400">...</p>
            ) : Object.keys(stats.earningsByCurrency).length > 1 ? (
              <div className="space-y-0.5">
                {Object.entries(stats.earningsByCurrency).map(([currency, amount]) => (
                  <p key={currency} className="text-xs font-bold text-green-600 dark:text-green-400">
                    {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'UAH' ? '₴' : currency}
                    {amount.toFixed(0)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                ${stats.totalEarnings.toFixed(0)}
              </p>
            )}
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Hours</p>
            <p className="text-base font-bold text-blue-600 dark:text-blue-400">
              {loading ? "..." : stats.totalActualHours.toFixed(1)}h
            </p>
            {stats.totalScheduledHours > 0 && stats.totalScheduledHours !== stats.totalActualHours && (
              <p className="text-[8px] text-muted-foreground">
                of {stats.totalScheduledHours.toFixed(1)}h
              </p>
            )}
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Shifts</p>
            <p className="text-base font-bold text-purple-600 dark:text-purple-400">
              {loading ? "..." : stats.shiftCount}
            </p>
            {stats.completedShifts > 0 && stats.shiftCount !== stats.completedShifts && (
              <p className="text-[8px] text-muted-foreground">
                {stats.completedShifts} done
              </p>
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
        <div className="hidden lg:flex lg:flex-col lg:gap-3">
          {/* Earnings Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Total Earnings</p>
            {loading ? (
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">...</p>
            ) : Object.keys(stats.earningsByCurrency).length > 1 ? (
              <div className="space-y-1">
                {Object.entries(stats.earningsByCurrency).map(([currency, amount]) => (
                  <div key={currency} className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">{currency}:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'UAH' ? '₴' : currency}
                      {amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${stats.totalEarnings.toFixed(2)}
              </p>
            )}
          </div>

          {/* Hours Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Hours Worked</p>
            {loading ? (
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">...</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalActualHours.toFixed(1)}h
                </p>
                {stats.totalScheduledHours > 0 && (
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Scheduled:</span>
                      <span>{stats.totalScheduledHours.toFixed(1)}h</span>
                    </div>
                    {stats.totalActualHours !== stats.totalScheduledHours && (
                      <div className={`flex justify-between font-medium ${
                        stats.totalActualHours > stats.totalScheduledHours
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}>
                        <span>Variance:</span>
                        <span>
                          {stats.totalActualHours > stats.totalScheduledHours ? '+' : ''}
                          {(stats.totalActualHours - stats.totalScheduledHours).toFixed(1)}h
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Shifts Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Shifts</p>
            {loading ? (
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">...</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.shiftCount}
                </p>
                {stats.shiftCount > 0 && (
                  <div className="mt-2 text-xs space-y-1">
                    {stats.completedShifts > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Completed:</span>
                        <span className="text-green-600 font-medium">{stats.completedShifts}</span>
                      </div>
                    )}
                    {stats.plannedShifts > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Planned:</span>
                        <span className="text-blue-600 font-medium">{stats.plannedShifts}</span>
                      </div>
                    )}
                    {stats.inProgressShifts > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>In Progress:</span>
                        <span className="text-yellow-600 font-medium">{stats.inProgressShifts}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
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

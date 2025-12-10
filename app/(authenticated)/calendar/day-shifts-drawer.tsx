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
import { Clock, DollarSign } from "lucide-react";
import { formatTimeFromTimestamp, getStatusInfo, getCurrencySymbol, formatHours, formatCurrency } from "@/lib/utils/time-format";

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
  shift_templates: Database["public"]["Tables"]["shift_templates"]["Row"] | null;
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
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
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

  // Calculate total worked hours vs day-off hours - only count completed entries
  const totalWorkedHours = completedEntries
    .filter(e => e.entry_type === 'work_shift')
    .reduce((sum, entry) => sum + (entry.actual_hours || 0), 0);
  const totalDayOffHours = completedEntries
    .filter(e => e.entry_type === 'day_off')
    .reduce((sum, entry) => sum + (entry.actual_hours || 0), 0);

  // Note: Earnings are now tracked separately in income_records table
  // This component only shows time entries

  const handleEntryClick = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
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
              <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
              <p className="text-lg font-semibold">{formatHours(totalHours)}</p>
              {totalDayOffHours > 0 && (
                <p className="text-xs text-muted-foreground">
                  Worked: {formatHours(totalWorkedHours)} | Day-off: {formatHours(totalDayOffHours)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Entries List */}
        {dayEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No entries for this day
            </p>
            <button
              onClick={() => setAddDialogOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              + Add Entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {dayEntries.map((entry) => {
                const hours = entry.actual_hours || 0;
                const status = getStatusInfo(entry.status || "planned");
                const isWorkShift = entry.entry_type === 'work_shift';
                const isDayOff = entry.entry_type === 'day_off';

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
                            {entry.jobs?.name || (isDayOff ? "Day Off" : "Personal Time")}
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
                                {entry.is_full_day ? 'Full day' : 'Partial day'} ({formatHours(hours)})
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
                              {entry.is_overnight && (
                                <span className="text-orange-500 text-[10px]">overnight</span>
                              )}
                              {entry.shift_templates && (
                                <span className="text-blue-500 text-[10px] ml-1">
                                  📋 {entry.shift_templates.short_code || entry.shift_templates.name}
                                </span>
                              )}
                            </div>

                            {entry.jobs && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                <span>
                                  {getCurrencySymbol(entry.jobs.currency || 'USD')} {rateDisplay}
                                </span>
                              </div>
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
                            Time Off
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

            {/* Add Entry Button */}
            <div className="pt-2 border-t flex justify-end pt-3">
              <button
                onClick={() => setAddDialogOpen(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                + Add Entry
              </button>
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
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{formattedDate}</DrawerTitle>
            <DrawerDescription>
              {dayEntries.length} {dayEntries.length === 1 ? "entry" : "entries"}
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
            {dayEntries.length} {dayEntries.length === 1 ? "entry" : "entries"}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

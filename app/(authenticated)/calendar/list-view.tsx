"use client";

import { useState } from "react";
import { Database } from "@/lib/database.types";
import { EditTimeEntryDialog } from "./edit-time-entry-dialog";
import { formatTimeFromTimestamp, getStatusInfo, formatHours, getCurrencySymbol, formatCurrency } from "@/lib/utils/time-format";

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
  shift_templates: Database["public"]["Tables"]["shift_templates"]["Row"] | null;
};

interface ListViewProps {
  entries: TimeEntry[];
  loading: boolean;
  onEntryChange?: () => void;
}

export function ListView({ entries, loading, onEntryChange }: ListViewProps) {
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEntryClick = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    onEntryChange?.();
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-muted/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No entries found for this month</p>
      </div>
    );
  }

  // Sort entries by date and start time
  const sortedEntries = [...entries].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    // Handle day_off entries that might not have start_time
    const aTime = a.start_time || "00:00";
    const bTime = b.start_time || "00:00";
    return aTime.localeCompare(bTime);
  });

  return (
    <>
      <div className="space-y-2">
        {sortedEntries.map((entry) => {
          const status = getStatusInfo(entry.status || "planned");
          const entryDate = new Date(entry.date);
          const formattedDate = entryDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          const isWorkShift = entry.entry_type === "work_shift";
          const isDayOff = entry.entry_type === "day_off";

          return (
            <div
              key={entry.id}
              onClick={() => handleEntryClick(entry)}
              className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${status.borderColor}`}
            >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Left side: Date and Job */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base">
                    {formattedDate}
                  </h3>
                  {isWorkShift && entry.start_time && entry.end_time && (
                    <span className="text-sm text-muted-foreground">
                      {entry.start_time} - {entry.end_time}
                    </span>
                  )}
                  {isDayOff && (
                    <span className="text-sm text-muted-foreground">
                      {entry.day_off_type?.toUpperCase()} - {entry.is_full_day ? "Full Day" : `${entry.actual_hours}h`}
                    </span>
                  )}
                  <span className="text-sm">{status.emoji}</span>
                  {entry.is_overnight && (
                    <span className="text-[10px] text-orange-500">overnight</span>
                  )}
                  {entry.shift_templates && (
                    <span className="text-blue-500 text-[10px]">
                      📋 {entry.shift_templates.short_code || entry.shift_templates.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {entry.jobs ? (
                    <>
                      <div
                        className="w-2 h-2 rounded"
                        style={{ backgroundColor: entry.jobs.color || "#3B82F6" }}
                      />
                      <p className="text-sm text-muted-foreground">
                        {entry.jobs.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded bg-gray-400" />
                      <p className="text-sm text-muted-foreground">
                        {isDayOff ? "Day Off" : "Personal Time"}
                      </p>
                    </>
                  )}
                </div>
                {entry.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {entry.notes}
                  </p>
                )}
              </div>

              {/* Right side: Stats */}
              <div className="flex items-center gap-4 md:gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Hours</p>
                  <p className="font-semibold">
                    {formatHours(entry.actual_hours || 0)}
                  </p>
                </div>
                {isWorkShift && entry.jobs && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p className="font-semibold">
                      {getCurrencySymbol(entry.jobs.currency)} {formatCurrency(entry.jobs.hourly_rate || entry.jobs.daily_rate || 0)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <EditTimeEntryDialog
      entry={selectedEntry}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onSuccess={handleEditSuccess}
    />
  </>
  );
}

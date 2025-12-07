"use client";

import { useState } from "react";
import { Database } from "@/lib/database.types";
import { EditShiftDialog } from "./edit-shift-dialog";
import { formatTimeFromTimestamp, getStatusInfo } from "@/lib/utils/time-format";

type Shift = Database["public"]["Tables"]["shifts"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

interface ListViewProps {
  shifts: Shift[];
  loading: boolean;
  onShiftChange?: () => void;
}

export function ListView({ shifts, loading, onShiftChange }: ListViewProps) {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    onShiftChange?.();
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

  if (shifts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No shifts found for this month</p>
      </div>
    );
  }

  // Sort shifts by date and start time
  const sortedShifts = [...shifts].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.start_time.localeCompare(b.start_time);
  });

  // Calculate earnings for each shift
  const getShiftEarnings = (shift: Shift) => {
    const hours = shift.actual_hours || 0;
    const rate = shift.jobs?.hourly_rate || 0;
    return hours * rate;
  };

  return (
    <>
      <div className="space-y-2">
        {sortedShifts.map((shift) => {
          const earnings = getShiftEarnings(shift);
          const status = getStatusInfo(shift.status);
          const startTime = formatTimeFromTimestamp(shift.start_time);
          const endTime = formatTimeFromTimestamp(shift.end_time);
          const shiftDate = new Date(shift.date);
          const formattedDate = shiftDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <div
              key={shift.id}
              onClick={() => handleShiftClick(shift)}
              className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${status.borderColor}`}
            >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Left side: Date and Job */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base">
                    {formattedDate}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {startTime} - {endTime}
                  </span>
                  <span className="text-sm">{status.emoji}</span>
                  {shift.is_overnight && (
                    <span className="text-[10px] text-orange-500">overnight</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {shift.jobs ? (
                    <>
                      <div
                        className="w-2 h-2 rounded"
                        style={{ backgroundColor: shift.jobs.color || "#3B82F6" }}
                      />
                      <p className="text-sm text-muted-foreground">
                        {shift.jobs.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded bg-gray-400" />
                      <p className="text-sm text-muted-foreground">Personal Time</p>
                    </>
                  )}
                </div>
                {shift.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {shift.notes}
                  </p>
                )}
              </div>

              {/* Right side: Stats */}
              <div className="flex items-center gap-4 md:gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Hours</p>
                  <p className="font-semibold">
                    {shift.actual_hours?.toFixed(1) || "0.0"}h
                  </p>
                </div>
                {shift.jobs && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p className="font-semibold">
                      ${shift.jobs.hourly_rate?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Earnings</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    ${earnings.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <EditShiftDialog
      shift={selectedShift}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onSuccess={handleEditSuccess}
    />
  </>
  );
}

"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Database } from "@/lib/database.types";
import { EditShiftDialog } from "./edit-shift-dialog";
import { AddShiftDialog } from "./add-shift-dialog";
import { Clock, DollarSign, Plus } from "lucide-react";
import { formatTimeFromTimestamp, getStatusInfo } from "@/lib/utils/time-format";

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

  if (!date) return null;

  const dateStr = date.toISOString().split("T")[0];
  const dayShifts = shifts.filter((shift) => shift.date === dateStr);

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const totalHours = dayShifts.reduce((sum, shift) => sum + (shift.actual_hours || 0), 0);
  const totalEarnings = dayShifts.reduce((sum, shift) => {
    const hours = shift.actual_hours || 0;
    const rate = shift.jobs?.hourly_rate || 0;
    return sum + (hours * rate);
  }, 0);

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    onShiftChange?.();
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const content = (
    <>
      <div className="space-y-4">
        {/* Summary */}
        {dayShifts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
              <p className="text-lg font-semibold">{totalHours.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                ${totalEarnings.toFixed(2)}
              </p>
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
          <div className="space-y-2">
            {dayShifts.map((shift) => {
              const earnings = (shift.actual_hours || 0) * (shift.jobs?.hourly_rate || 0);
              const status = getStatusInfo(shift.status);
              const startTime = formatTimeFromTimestamp(shift.start_time);
              const endTime = formatTimeFromTimestamp(shift.end_time);

              return (
                <button
                  key={shift.id}
                  onClick={() => handleShiftClick(shift)}
                  className={`w-full border rounded-lg p-3 hover:bg-muted/50 transition-colors text-left ${status.borderColor}`}
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

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {startTime} - {endTime}
                          </span>
                          <span className="ml-1">({shift.actual_hours?.toFixed(1) || "0.0"}h)</span>
                          {shift.is_overnight && (
                            <span className="text-orange-500 text-[10px]">overnight</span>
                          )}
                        </div>

                        {shift.jobs && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <DollarSign className="h-3 w-3" />
                            <span>${shift.jobs.hourly_rate?.toFixed(2) || "0.00"}/hr</span>
                          </div>
                        )}
                      </div>

                      {shift.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {shift.notes}
                        </p>
                      )}
                    </div>

                    {/* Right side - Earnings */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${earnings.toFixed(2)}
                      </p>
                      <p className={`text-[10px] ${status.color}`}>
                        {status.label}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
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

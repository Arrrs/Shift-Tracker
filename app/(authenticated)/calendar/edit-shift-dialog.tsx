"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateShift, deleteShift } from "./actions";
import { getJobs } from "../jobs/actions";
import { Database } from "@/lib/database.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type Shift = Database["public"]["Tables"]["shifts"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

interface EditShiftDialogProps {
  shift: Shift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditShiftDialog({
  shift,
  open,
  onOpenChange,
  onSuccess,
}: EditShiftDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    actual_hours: 0,
    notes: "",
    status: "planned" as string,
  });

  const [sameAsScheduled, setSameAsScheduled] = useState(true);
  const [isOvernight, setIsOvernight] = useState(false);
  const [scheduledHours, setScheduledHours] = useState(0);

  // Load jobs on mount
  useEffect(() => {
    const loadJobs = async () => {
      const result = await getJobs();
      if (result.jobs) {
        const activeJobs = result.jobs.filter((job) => job.is_active);
        setJobs(activeJobs);
      }
    };
    loadJobs();
  }, []);

  // Load shift data when shift changes
  useEffect(() => {
    if (shift) {
      // Extract time from TIMESTAMPTZ (format: "2024-12-07T14:30:00+00:00")
      const extractTime = (timestamp: string) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toTimeString().slice(0, 5); // "HH:MM"
      };

      const startTime = extractTime(shift.start_time);
      const endTime = shift.end_time ? extractTime(shift.end_time) : "";
      const scheduled = shift.scheduled_hours || 0;
      const actual = shift.actual_hours || 0;

      setFormData({
        date: shift.date,
        start_time: startTime,
        end_time: endTime,
        actual_hours: actual,
        notes: shift.notes || "",
        status: shift.status || "planned",
      });
      setSelectedJobId(shift.job_id || "no-job");
      setScheduledHours(scheduled);
      setIsOvernight(shift.is_overnight || false);
      setSameAsScheduled(scheduled === actual && scheduled > 0);
    }
  }, [shift]);

  // Auto-calculate scheduled hours and detect overnight shifts
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const start = new Date(`2000-01-01T${formData.start_time}`);
      let end = new Date(`2000-01-01T${formData.end_time}`);

      // Check if overnight (end before start)
      if (end <= start) {
        setIsOvernight(true);
        end = new Date(`2000-01-02T${formData.end_time}`); // Next day
      } else {
        setIsOvernight(false);
      }

      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const roundedHours = Math.round(hours * 2) / 2; // Round to nearest 0.5
      setScheduledHours(roundedHours);

      // If "same as scheduled" is checked, update actual hours
      if (sameAsScheduled) {
        setFormData((prev) => ({
          ...prev,
          actual_hours: roundedHours,
        }));
      }
    }
  }, [formData.start_time, formData.end_time, sameAsScheduled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shift) return;

    if (!formData.start_time || !formData.end_time) {
      toast.error("Please enter start and end times");
      return;
    }

    setLoading(true);

    const result = await updateShift(shift.id, {
      job_id: selectedJobId && selectedJobId !== "no-job" ? selectedJobId : null,
      date: formData.date,
      start_time: `${formData.date}T${formData.start_time}:00Z`,
      end_time: `${formData.date}T${formData.end_time}:00Z`,
      actual_hours: formData.actual_hours,
      scheduled_hours: scheduledHours,
      is_overnight: isOvernight,
      status: formData.status,
      notes: formData.notes || null,
    });

    setLoading(false);

    if (result.error) {
      toast.error("Failed to update shift", { description: result.error });
    } else {
      toast.success("Shift updated");
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleDelete = async () => {
    if (!shift) return;

    setDeleting(true);

    const result = await deleteShift(shift.id);

    setDeleting(false);

    if (result.error) {
      toast.error("Failed to delete shift", { description: result.error });
    } else {
      toast.success("Shift deleted");
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  if (!shift) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const content = (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Job Selection */}
        <div className="space-y-2">
          <Label htmlFor="edit-job">Job</Label>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger id="edit-job">
              <SelectValue placeholder="Select a job (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-job">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-400" />
                  No Job (Personal Time)
                </div>
              </SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: job.color || "#3B82F6" }}
                    />
                    {job.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="edit-date">Date *</Label>
          <Input
            id="edit-date"
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
            required
          />
        </div>

        {/* Status Selector */}
        <div className="space-y-2">
          <Label htmlFor="edit-status">Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
            <SelectTrigger id="edit-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">📅 Planned</SelectItem>
              <SelectItem value="in_progress">⏳ In Progress</SelectItem>
              <SelectItem value="completed">✅ Completed</SelectItem>
              <SelectItem value="cancelled">❌ Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scheduled Time Section */}
        <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
          <Label className="text-sm font-semibold">Scheduled Shift Time</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-start-time" className="text-xs">Start Time *</Label>
              <Input
                id="edit-start-time"
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, start_time: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-time" className="text-xs">End Time *</Label>
              <Input
                id="edit-end-time"
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end_time: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {scheduledHours > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Scheduled Duration:</span>
              <span className="font-semibold">
                {scheduledHours}h {isOvernight && <span className="text-xs text-orange-500">(overnight)</span>}
              </span>
            </div>
          )}
        </div>

        {/* Actual Hours Worked Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-same-as-scheduled"
              checked={sameAsScheduled}
              onChange={(e) => setSameAsScheduled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="edit-same-as-scheduled" className="text-sm font-normal cursor-pointer">
              Worked exactly as scheduled
            </Label>
          </div>

          {!sameAsScheduled && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="edit-actual-hours" className="text-xs text-muted-foreground">
                Different hours actually worked (e.g., unpaid lunch break)
              </Label>
              <Input
                id="edit-actual-hours"
                type="number"
                step="0.5"
                min="0"
                value={formData.actual_hours === 0 ? "" : formData.actual_hours}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    actual_hours: value === "" ? 0 : parseFloat(value),
                  }));
                }}
                placeholder={`${scheduledHours}h scheduled`}
              />
              {formData.actual_hours > 0 && scheduledHours > 0 && (
                <p className="text-xs text-muted-foreground">
                  Variance: {formData.actual_hours > scheduledHours ? '+' : ''}
                  {(formData.actual_hours - scheduledHours).toFixed(1)}h
                  {formData.actual_hours > scheduledHours && <span className="text-green-600"> (overtime)</span>}
                  {formData.actual_hours < scheduledHours && <span className="text-orange-600"> (undertime)</span>}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="edit-notes">Notes (optional)</Label>
          <Input
            id="edit-notes"
            placeholder="Add any notes about this shift..."
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1"
          >
            Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this shift. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Shift</DrawerTitle>
            <DrawerDescription>
              Update shift details or delete
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
          <DialogTitle>Edit Shift</DialogTitle>
          <DialogDescription>
            Update shift details or delete
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTimeEntry } from "../time-entries/actions";
import { getJobs, getShiftTemplates } from "../jobs/actions";
import { Database } from "@/lib/database.types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type ShiftTemplate = Database["public"]["Tables"]["shift_templates"]["Row"];

interface AddTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string;
  onSuccess?: () => void;
}

export function AddTimeEntryDialog({ open, onOpenChange, initialDate, onSuccess }: AddTimeEntryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Form state
  const [entryType, setEntryType] = useState<"work_shift" | "day_off">("work_shift");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [date, setDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [actualHours, setActualHours] = useState<number>(8);
  const [customHourlyRate, setCustomHourlyRate] = useState<string>("");
  const [status, setStatus] = useState("planned");
  const [notes, setNotes] = useState("");

  // Day-off specific
  const [dayOffType, setDayOffType] = useState("pto");
  const [isFullDay, setIsFullDay] = useState(true);
  const [dayOffHours, setDayOffHours] = useState(8);

  // Load jobs
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

  // Load templates when job changes
  useEffect(() => {
    const loadTemplates = async () => {
      setTemplates([]);
      setSelectedTemplateId("");

      if (!selectedJobId || selectedJobId === "none") return;

      setLoadingTemplates(true);
      const result = await getShiftTemplates(selectedJobId);
      if (result.templates) {
        setTemplates(result.templates);
      }
      setLoadingTemplates(false);
    };
    loadTemplates();
  }, [selectedJobId]);

  // Auto-calculate hours when times change
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      let end = new Date(`2000-01-01T${endTime}`);

      if (end <= start) {
        end = new Date(`2000-01-02T${endTime}`);
      }

      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      setActualHours(Math.round(hours * 2) / 2);
    }
  }, [startTime, endTime]);

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setStartTime(template.start_time);
      setEndTime(template.end_time);
      setActualHours(template.expected_hours);
      setSelectedTemplateId(templateId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (entryType === "work_shift" && (!startTime || !endTime)) {
      toast.error("Please enter start and end times");
      return;
    }

    setLoading(true);

    const baseData = {
      date,
      status,
      notes: notes || undefined,
    };

    let result;

    if (entryType === "day_off") {
      result = await createTimeEntry({
        ...baseData,
        entry_type: "day_off",
        day_off_type: dayOffType,
        actual_hours: isFullDay ? dayOffHours : dayOffHours,
        is_full_day: isFullDay,
        job_id: selectedJobId && selectedJobId !== "none" ? selectedJobId : null,
      });
    } else {
      const scheduledHours = actualHours; // For now, same as actual

      result = await createTimeEntry({
        ...baseData,
        entry_type: "work_shift",
        job_id: selectedJobId && selectedJobId !== "none" ? selectedJobId : null,
        template_id: selectedTemplateId && selectedTemplateId !== "none" ? selectedTemplateId : null,
        start_time: startTime,
        end_time: endTime,
        scheduled_hours: scheduledHours,
        actual_hours: actualHours,
        is_overnight: endTime <= startTime,
        custom_hourly_rate: customHourlyRate ? parseFloat(customHourlyRate) : null,
      });
    }

    setLoading(false);

    if (result.error) {
      toast.error("Failed to create entry", { description: result.error });
    } else {
      toast.success("Entry created");
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedJobId("");
    setSelectedTemplateId("");
    setStartTime("09:00");
    setEndTime("17:00");
    setActualHours(8);
    setCustomHourlyRate("");
    setNotes("");
    setDayOffHours(8);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
          <DialogDescription>Log a shift or day-off</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={entryType} onValueChange={(v) => setEntryType(v as "work_shift" | "day_off")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work_shift">💼 Work Shift</SelectItem>
                <SelectItem value="day_off">🏖️ Day Off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          {/* Job Selection */}
          <div className="space-y-2">
            <Label>Job {entryType === "work_shift" && "(Optional)"}</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Job</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: job.color || "#3B82F6" }} />
                      {job.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {entryType === "work_shift" ? (
            <>
              {/* Template (Optional) */}
              {selectedJobId && templates.length > 0 && (
                <div className="space-y-2">
                  <Label>Template (Optional)</Label>
                  <Select value={selectedTemplateId} onValueChange={applyTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose template or enter manually" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Manual Entry</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.short_code ? `${template.name} (${template.short_code})` : template.name} -{" "}
                          {template.start_time} to {template.end_time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Time *</Label>
                  <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Time *</Label>
                  <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
              </div>

              {/* Hours */}
              <div className="space-y-2">
                <Label htmlFor="hours">Hours Worked *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={actualHours}
                  onChange={(e) => setActualHours(parseFloat(e.target.value))}
                  required
                />
              </div>

              {/* Custom Hourly Rate (optional) */}
              {selectedJobId && selectedJobId !== "none" && jobs.find(j => j.id === selectedJobId)?.pay_type === 'hourly' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-rate">
                    Custom Hourly Rate (optional)
                    <span className="text-xs text-muted-foreground ml-2">
                      Leave empty to use job default
                    </span>
                  </Label>
                  <Input
                    id="custom-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="15.00"
                    value={customHourlyRate}
                    onChange={(e) => setCustomHourlyRate(e.target.value)}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Day Off Type */}
              <div className="space-y-2">
                <Label>Day Off Type</Label>
                <Select value={dayOffType} onValueChange={setDayOffType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pto">🏖️ PTO / Vacation</SelectItem>
                    <SelectItem value="sick">🤒 Sick Day</SelectItem>
                    <SelectItem value="personal">👤 Personal Day</SelectItem>
                    <SelectItem value="unpaid">⛔ Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Full/Partial Day */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fullDay"
                  checked={isFullDay}
                  onChange={(e) => setIsFullDay(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="fullDay">Full day ({dayOffHours}h)</Label>
              </div>

              {!isFullDay && (
                <div className="space-y-2">
                  <Label htmlFor="dayOffHours">Hours</Label>
                  <Input
                    id="dayOffHours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={dayOffHours}
                    onChange={(e) => setDayOffHours(parseFloat(e.target.value))}
                  />
                </div>
              )}
            </>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">📅 Planned</SelectItem>
                <SelectItem value="completed">✅ Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Entry"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

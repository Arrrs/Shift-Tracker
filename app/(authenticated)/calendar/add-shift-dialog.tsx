"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { createShift } from "./actions";
import { getJobs } from "../jobs/actions";
import { getShiftTemplates } from "../jobs/actions";
import { Database } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type ShiftTemplate = Database["public"]["Tables"]["shift_templates"]["Row"];

interface AddShiftDialogProps {
  selectedDate?: Date;
  onSuccess?: () => void;
}

export function AddShiftDialog({ selectedDate, onSuccess }: AddShiftDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [entryMode, setEntryMode] = useState<"template" | "manual">("template");
  const [showCustomRate, setShowCustomRate] = useState(false);
  const [holidayPayType, setHolidayPayType] = useState<"multiplier" | "fixed" | "custom">("multiplier");

  const [formData, setFormData] = useState(() => ({
    date: selectedDate?.toISOString().split("T")[0] || "",
    start_time: "",
    end_time: "",
    actual_hours: 0,
    notes: "",
    custom_hourly_rate: 0,
    is_holiday: false,
    holiday_multiplier: 1.5,
    holiday_fixed_rate: 0,
  }));

  const [sameAsScheduled, setSameAsScheduled] = useState(true);
  const [isOvernight, setIsOvernight] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

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

  // Load templates when job is selected
  useEffect(() => {
    const loadTemplates = async () => {
      if (!selectedJobId || selectedJobId === "no-job") {
        setTemplates([]);
        return;
      }
      const result = await getShiftTemplates(selectedJobId);
      if (result.templates) {
        setTemplates(result.templates);
      }
    };
    loadTemplates();
  }, [selectedJobId]);

  // Update date when selectedDate prop changes or on mount
  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date: selectedDate.toISOString().split("T")[0],
      }));
    } else if (!formData.date) {
      // Set today's date only on client side
      setFormData((prev) => ({
        ...prev,
        date: new Date().toISOString().split("T")[0],
      }));
    }
  }, [selectedDate]);

  // Set smart default times when dialog opens (only once, when form is empty)
  useEffect(() => {
    if (open && !formData.start_time && !formData.end_time) {
      setFormData((prev) => ({
        ...prev,
        start_time: "08:00", // Default to 8 AM
        end_time: "17:00",   // Default to 5 PM (9 hour shift)
      }));
    }
  }, [open]);

  // Auto-calculate scheduled hours and detect overnight shifts
  const [scheduledHours, setScheduledHours] = useState(0);

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

  // Apply template when selected
  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        start_time: template.start_time,
        end_time: template.end_time,
        actual_hours: template.expected_hours,
      }));
      setSelectedTemplate(templateId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.start_time || !formData.end_time) {
      toast.error("Please enter start and end times");
      return;
    }

    setLoading(true);

    // Prepare shift data
    // Normalize time format: if time already has seconds (HH:MM:SS), use as-is; otherwise add :00
    const normalizeTime = (time: string) => {
      // If time is already HH:MM:SS format (from template), return as-is
      if (time.split(':').length === 3) {
        return time;
      }
      // If time is HH:MM format (from input), add seconds
      return `${time}:00`;
    };

    const shiftData = {
      job_id: selectedJobId && selectedJobId !== "no-job" ? selectedJobId : null,
      date: formData.date,
      start_time: `${formData.date}T${normalizeTime(formData.start_time)}Z`,
      end_time: `${formData.date}T${normalizeTime(formData.end_time)}Z`,
      actual_hours: formData.actual_hours,
      scheduled_hours: scheduledHours,
      is_overnight: isOvernight,
      notes: formData.notes || null,
      custom_hourly_rate: formData.custom_hourly_rate > 0 ? formData.custom_hourly_rate : null,
      is_holiday: formData.is_holiday,
      holiday_multiplier: formData.is_holiday && holidayPayType !== "fixed" && formData.holiday_multiplier > 0 ? formData.holiday_multiplier : null,
      holiday_fixed_rate: formData.is_holiday && holidayPayType === "fixed" && formData.holiday_fixed_rate > 0 ? formData.holiday_fixed_rate : null,
    };

    const result = await createShift(shiftData);

    setLoading(false);

    if (result.error) {
      toast.error("Failed to create shift", { description: result.error });
    } else {
      toast.success("Shift created");
      setOpen(false);
      onSuccess?.();
      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        start_time: "",
        end_time: "",
        actual_hours: 0,
        notes: "",
        custom_hourly_rate: 0,
        is_holiday: false,
        holiday_multiplier: 1.5,
        holiday_fixed_rate: 0,
      });
      setSelectedJobId("");
      setSelectedTemplate("");
      setShowCustomRate(false);
      setHolidayPayType("multiplier");
      setSameAsScheduled(true);
      setIsOvernight(false);
      setScheduledHours(0);
    }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Job Selection */}
      <div className="space-y-2">
        <Label htmlFor="job">Job</Label>
        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
          <SelectTrigger id="job">
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
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, date: e.target.value }))
          }
          required
        />
      </div>

      {/* Entry Mode Tabs - Template first, Manual second */}
      {templates.length > 0 && (
        <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as "template" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template">Use Template</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-3 mt-4">
            <div className="grid grid-cols-1 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                    selectedTemplate === template.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: template.color || "#3B82F6" }}
                    />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{template.name}</p>
                        {template.short_code && (
                          <Badge variant="outline" className="text-xs">
                            {template.short_code}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {template.start_time} - {template.end_time}
                        </span>
                        <span className="ml-1">({template.expected_hours}h)</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Scheduled Time Section */}
      <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
        <Label className="text-sm font-semibold">Scheduled Shift Time</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="start_time" className="text-xs">Start Time *</Label>
            <Input
              id="start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, start_time: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_time" className="text-xs">End Time *</Label>
            <Input
              id="end_time"
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
            id="same_as_scheduled"
            checked={sameAsScheduled}
            onChange={(e) => setSameAsScheduled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="same_as_scheduled" className="text-sm font-normal cursor-pointer">
            Worked exactly as scheduled
          </Label>
        </div>

        {!sameAsScheduled && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="actual_hours" className="text-xs text-muted-foreground">
              Different hours actually worked (e.g., unpaid lunch break)
            </Label>
            <Input
              id="actual_hours"
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

      {/* Custom Hourly Rate Toggle */}
      {selectedJobId && selectedJobId !== "no-job" && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show_custom_rate"
            checked={showCustomRate}
            onChange={(e) => {
              setShowCustomRate(e.target.checked);
              if (!e.target.checked) {
                setFormData((prev) => ({ ...prev, custom_hourly_rate: 0 }));
              }
            }}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="show_custom_rate" className="text-sm font-normal cursor-pointer">
            Use custom hourly rate for this shift
          </Label>
        </div>
      )}

      {/* Custom Hourly Rate Input */}
      {(showCustomRate || !selectedJobId || selectedJobId === "no-job") && (
        <div className="space-y-2">
          <Label htmlFor="custom_rate">
            Custom Hourly Rate {(!selectedJobId || selectedJobId === "no-job") && "*"}
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              id="custom_rate"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter hourly rate"
              value={formData.custom_hourly_rate === 0 ? "" : formData.custom_hourly_rate}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  custom_hourly_rate: value === "" ? 0 : parseFloat(value),
                }));
              }}
            />
            <span className="text-sm text-muted-foreground">/hr</span>
          </div>
        </div>
      )}

      {/* Holiday Toggle and Multiplier */}
      <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_holiday"
            checked={formData.is_holiday}
            onChange={(e) => setFormData((prev) => ({ ...prev, is_holiday: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="is_holiday" className="text-sm font-normal cursor-pointer">
            This is a holiday shift
          </Label>
        </div>

        {formData.is_holiday && (
          <div className="space-y-3 pl-6">
            {/* Holiday Pay Type Selector */}
            <div className="space-y-2">
              <Label className="text-xs">Holiday Pay Type</Label>
              <Select value={holidayPayType} onValueChange={(v) => setHolidayPayType(v as "multiplier" | "fixed" | "custom")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiplier">Standard Multiplier</SelectItem>
                  <SelectItem value="fixed">Fixed Hourly Rate</SelectItem>
                  <SelectItem value="custom">Custom Multiplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Standard Multiplier */}
            {holidayPayType === "multiplier" && (
              <div className="space-y-2">
                <Select
                  value={formData.holiday_multiplier.toString()}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, holiday_multiplier: parseFloat(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.25">1.25x (Time and a quarter)</SelectItem>
                    <SelectItem value="1.5">1.5x (Time and a half)</SelectItem>
                    <SelectItem value="1.75">1.75x</SelectItem>
                    <SelectItem value="2">2x (Double time)</SelectItem>
                    <SelectItem value="2.5">2.5x</SelectItem>
                    <SelectItem value="3">3x (Triple time)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Your earnings will be multiplied by {formData.holiday_multiplier}x
                </p>
              </div>
            )}

            {/* Fixed Rate */}
            {holidayPayType === "fixed" && (
              <div className="space-y-2">
                <Label className="text-xs">Holiday Hourly Rate</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter fixed holiday rate"
                    value={formData.holiday_fixed_rate === 0 ? "" : formData.holiday_fixed_rate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        holiday_fixed_rate: value === "" ? 0 : parseFloat(value),
                        holiday_multiplier: 0, // Clear multiplier when using fixed rate
                      }));
                    }}
                  />
                  <span className="text-sm text-muted-foreground">/hr</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fixed hourly rate regardless of base pay
                </p>
              </div>
            )}

            {/* Custom Multiplier */}
            {holidayPayType === "custom" && (
              <div className="space-y-2">
                <Label className="text-xs">Custom Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Enter multiplier (e.g., 2.3)"
                  value={formData.holiday_multiplier === 0 ? "" : formData.holiday_multiplier}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      holiday_multiplier: value === "" ? 0 : parseFloat(value),
                    }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Your earnings will be multiplied by {formData.holiday_multiplier}x
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
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
          variant="outline"
          onClick={() => setOpen(false)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Shift"
          )}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Add New Shift</DrawerTitle>
            <DrawerDescription>
              Log a shift manually or use a template
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto max-h-[calc(90vh-100px)]">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Shift
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Shift</DialogTitle>
          <DialogDescription>
            Log a shift manually or use a template
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

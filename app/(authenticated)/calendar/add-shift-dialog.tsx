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
  const [entryMode, setEntryMode] = useState<"manual" | "template">("manual");

  const [formData, setFormData] = useState(() => ({
    date: selectedDate?.toISOString().split("T")[0] || "",
    start_time: "",
    end_time: "",
    actual_hours: 0,
    notes: "",
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
      if (!selectedJobId) {
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
    const shiftData = {
      job_id: selectedJobId && selectedJobId !== "no-job" ? selectedJobId : null,
      date: formData.date,
      start_time: `${formData.date}T${formData.start_time}:00Z`,
      end_time: `${formData.date}T${formData.end_time}:00Z`,
      actual_hours: formData.actual_hours,
      scheduled_hours: scheduledHours,
      is_overnight: isOvernight,
      notes: formData.notes || null,
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
      });
      setSelectedJobId("");
      setSelectedTemplate("");
      setEntryMode("manual");
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

      {/* Entry Mode Tabs */}
      {templates.length > 0 && (
        <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as "manual" | "template")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="template">Use Template</TabsTrigger>
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

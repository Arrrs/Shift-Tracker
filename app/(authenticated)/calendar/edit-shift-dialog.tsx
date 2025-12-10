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
import { Loader2, Clock, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { updateShift, deleteShift } from "./actions";
import { getJobs, getShiftTemplates } from "../jobs/actions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatHours, calculateShiftEarnings, formatCurrency } from "@/lib/utils/time-format";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type ShiftTemplate = Database["public"]["Tables"]["shift_templates"]["Row"];
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
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [showCustomRate, setShowCustomRate] = useState(false);
  const [holidayPayType, setHolidayPayType] = useState<"multiplier" | "fixed" | "custom">("multiplier");

  // Custom earnings override state
  const [useCustomEarnings, setUseCustomEarnings] = useState(false);
  const [customEarnings, setCustomEarnings] = useState("");

  // Day-off state
  const [isDayOff, setIsDayOff] = useState(false);
  const [dayOffType, setDayOffType] = useState<string>("pto");
  const [isFullDay, setIsFullDay] = useState(true);
  const [dayOffHours, setDayOffHours] = useState(8);

  // Template state
  const [entryMode, setEntryMode] = useState<"template" | "manual">("manual");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    actual_hours: 0,
    notes: "",
    status: "planned" as string,
    custom_hourly_rate: 0,
    is_holiday: false,
    holiday_multiplier: 1.5,
    holiday_fixed_rate: 0,
    shift_type: "work" as string,
  });

  const [sameAsScheduled, setSameAsScheduled] = useState(true);
  const [isOvernight, setIsOvernight] = useState(false);
  const [scheduledHours, setScheduledHours] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      // Immediately clear templates when job changes to avoid showing old templates
      setTemplates([]);
      setSelectedTemplate("");
      setLoadingTemplates(false);

      if (!selectedJobId || selectedJobId === "no-job") {
        return;
      }

      setLoadingTemplates(true);
      const result = await getShiftTemplates(selectedJobId);
      if (result.templates) {
        setTemplates(result.templates);
      }
      setLoadingTemplates(false);
    };
    loadTemplates();
  }, [selectedJobId]);

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

      // Check if this is a day-off shift
      const isShiftDayOff = !!(shift.shift_type && shift.shift_type !== 'work');
      setIsDayOff(isShiftDayOff);

      if (isShiftDayOff) {
        // Load day-off specific data
        setDayOffType(shift.shift_type || "pto");
        setDayOffHours(actual);
        // Use is_full_day_off from database if available, otherwise infer from hours
        setIsFullDay(shift.is_full_day_off !== null ? shift.is_full_day_off : actual === 8);
      }

      setFormData({
        date: shift.date,
        start_time: startTime,
        end_time: endTime,
        actual_hours: actual,
        notes: shift.notes || "",
        status: shift.status || "planned",
        custom_hourly_rate: shift.custom_hourly_rate || 0,
        is_holiday: shift.is_holiday || false,
        holiday_multiplier: shift.holiday_multiplier || 1.5,
        holiday_fixed_rate: shift.holiday_fixed_rate || 0,
        shift_type: shift.shift_type || "work",
      });
      setSelectedJobId(shift.job_id || "no-job");
      setScheduledHours(scheduled);
      setIsOvernight(shift.is_overnight || false);
      setShowCustomRate(!!(shift.custom_hourly_rate && shift.custom_hourly_rate > 0));

      // Determine holiday pay type from existing data
      if (shift.is_holiday) {
        if (shift.holiday_fixed_rate && shift.holiday_fixed_rate > 0) {
          setHolidayPayType("fixed");
        } else if (shift.holiday_multiplier && ![1.25, 1.5, 1.75, 2, 2.5, 3].includes(shift.holiday_multiplier)) {
          setHolidayPayType("custom");
        } else {
          setHolidayPayType("multiplier");
        }
      }
      setSameAsScheduled(scheduled === actual && scheduled > 0);

      // Initialize custom earnings state
      setUseCustomEarnings(shift.earnings_manual_override || false);
      setCustomEarnings(shift.actual_earnings !== null ? shift.actual_earnings.toString() : "");
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
      setEntryMode("manual"); // Switch to manual after applying to show the values
    }
  };

  // Calculate what earnings WOULD be (for display purposes)
  const calculatedEarnings = (() => {
    if (!shift?.jobs || isDayOff) return null;

    const job = shift.jobs;

    // For fixed income jobs, no per-shift earnings
    if (job.show_in_fixed_income && (job.pay_type === 'monthly' || job.pay_type === 'salary')) {
      return null;
    }

    return calculateShiftEarnings(
      {
        actual_hours: formData.actual_hours,
        shift_type: formData.shift_type,
        custom_hourly_rate: formData.custom_hourly_rate > 0 ? formData.custom_hourly_rate : undefined,
        is_holiday: formData.is_holiday,
        holiday_multiplier: formData.is_holiday ? formData.holiday_multiplier : undefined,
        holiday_fixed_rate: formData.is_holiday && holidayPayType === "fixed" ? formData.holiday_fixed_rate : undefined,
      },
      job
    );
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shift) return;

    if (!isDayOff && (!formData.start_time || !formData.end_time)) {
      toast.error("Please enter start and end times");
      return;
    }

    setLoading(true);

    // Normalize time format: if time already has seconds (HH:MM:SS), use as-is; otherwise add :00
    const normalizeTime = (time: string) => {
      // If time is already HH:MM:SS format, return as-is
      if (time.split(':').length === 3) {
        return time;
      }
      // If time is HH:MM format, add seconds
      return `${time}:00`;
    };

    // Prepare custom earnings if user provided them
    const earningsOverride = useCustomEarnings && customEarnings ? {
      actual_earnings: parseFloat(customEarnings),
      earnings_manual_override: true,
    } : {};

    const shiftData = isDayOff ? {
      job_id: selectedJobId && selectedJobId !== "no-job" ? selectedJobId : null,
      date: formData.date,
      start_time: `${formData.date}T00:00:00Z`, // Dummy time for day-offs
      end_time: `${formData.date}T00:00:00Z`,
      actual_hours: isFullDay ? dayOffHours : dayOffHours,
      scheduled_hours: isFullDay ? dayOffHours : dayOffHours,
      is_overnight: false,
      status: formData.status,
      notes: formData.notes || null,
      custom_hourly_rate: null,
      is_holiday: false,
      holiday_multiplier: null,
      holiday_fixed_rate: null,
      shift_type: dayOffType,
      is_full_day_off: isFullDay,
    } : {
      job_id: selectedJobId && selectedJobId !== "no-job" ? selectedJobId : null,
      date: formData.date,
      start_time: `${formData.date}T${normalizeTime(formData.start_time)}Z`,
      end_time: `${formData.date}T${normalizeTime(formData.end_time)}Z`,
      actual_hours: formData.actual_hours,
      scheduled_hours: scheduledHours,
      is_overnight: isOvernight,
      status: formData.status,
      notes: formData.notes || null,
      custom_hourly_rate: formData.custom_hourly_rate > 0 ? formData.custom_hourly_rate : null,
      is_holiday: formData.is_holiday,
      holiday_multiplier: formData.is_holiday && holidayPayType !== "fixed" && formData.holiday_multiplier > 0 ? formData.holiday_multiplier : null,
      holiday_fixed_rate: formData.is_holiday && holidayPayType === "fixed" && formData.holiday_fixed_rate > 0 ? formData.holiday_fixed_rate : null,
      shift_type: "work",
      is_full_day_off: null,
      ...earningsOverride,
    };

    const result = await updateShift(shift.id, shiftData);

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

        {/* Day Off Toggle */}
        <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-is-day-off"
              checked={isDayOff}
              onChange={(e) => {
                setIsDayOff(e.target.checked);
                if (e.target.checked) {
                  // Clear work-specific fields when switching to day-off
                  setFormData(prev => ({
                    ...prev,
                    is_holiday: false,
                    custom_hourly_rate: 0
                  }));
                  setShowCustomRate(false);
                }
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="edit-is-day-off" className="text-sm font-normal cursor-pointer">
              This is a day off (PTO, sick, etc.)
            </Label>
          </div>

          {isDayOff && (
            <div className="space-y-3 pl-6">
              {/* Day-off Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs">Type of Day Off</Label>
                <Select value={dayOffType} onValueChange={setDayOffType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pto">
                      <div className="flex items-center justify-between w-full">
                        <span>🏖️ PTO / Vacation</span>
                        <span className="text-[10px] text-green-600 ml-2">💰 Paid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sick">
                      <div className="flex items-center justify-between w-full">
                        <span>🤒 Sick Day</span>
                        <span className="text-[10px] text-green-600 ml-2">💰 Paid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="personal">
                      <div className="flex items-center justify-between w-full">
                        <span>👤 Personal Day</span>
                        <span className="text-[10px] text-green-600 ml-2">💰 Paid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="unpaid">
                      <div className="flex items-center justify-between w-full">
                        <span>⛔ Unpaid Leave</span>
                        <span className="text-[10px] text-orange-600 ml-2">⚠️ Unpaid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bereavement">
                      <div className="flex items-center justify-between w-full">
                        <span>🕊️ Bereavement</span>
                        <span className="text-[10px] text-green-600 ml-2">💰 Paid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="maternity">
                      <div className="flex items-center justify-between w-full">
                        <span>🍼 Maternity Leave</span>
                        <span className="text-[10px] text-green-600 ml-2">💰 Paid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="paternity">
                      <div className="flex items-center justify-between w-full">
                        <span>👶 Paternity Leave</span>
                        <span className="text-[10px] text-green-600 ml-2">💰 Paid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="jury_duty">
                      <div className="flex items-center justify-between w-full">
                        <span>⚖️ Jury Duty</span>
                        <span className="text-[10px] text-green-600 ml-2">💰 Paid</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {dayOffType === 'pto' && '💰 Paid time off - counts towards earnings'}
                  {dayOffType === 'sick' && '💰 Paid sick leave - counts towards earnings'}
                  {dayOffType === 'personal' && '💰 Paid personal day - counts towards earnings'}
                  {dayOffType === 'unpaid' && '⚠️ Unpaid leave - does not count towards earnings'}
                  {dayOffType === 'bereavement' && '💰 Paid bereavement leave - counts towards earnings'}
                  {dayOffType === 'maternity' && '💰 Paid maternity leave - counts towards earnings'}
                  {dayOffType === 'paternity' && '💰 Paid paternity leave - counts towards earnings'}
                  {dayOffType === 'jury_duty' && '💰 Paid jury duty - counts towards earnings'}
                </p>
              </div>

              {/* Full/Partial Day Toggle */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-is-full-day"
                    checked={isFullDay}
                    onChange={(e) => {
                      setIsFullDay(e.target.checked);
                      if (e.target.checked && dayOffHours !== 8) {
                        setDayOffHours(8); // Reset to default when checking
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="edit-is-full-day" className="text-xs font-normal cursor-pointer">
                    Full day
                  </Label>
                </div>

                {/* Show hours input for both full and partial days */}
                <div className="space-y-2 pl-6">
                  <Label className="text-xs">
                    {isFullDay ? 'Full day hours (default: 8)' : 'Partial day hours'}
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={dayOffHours}
                    onChange={(e) => setDayOffHours(parseFloat(e.target.value) || 8)}
                    placeholder={isFullDay ? "8" : "Enter hours (e.g., 4 for half day)"}
                  />
                  {isFullDay && (
                    <p className="text-xs text-muted-foreground">
                      Customize if your standard day is different (e.g., 7.5h)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Entry Mode Tabs - Template first, Manual second - ONLY FOR WORK SHIFTS */}
        {!isDayOff && (selectedJobId && selectedJobId !== "no-job") && (
        <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as "template" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template">Use Template</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-3 mt-4">
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <p>No templates found for this job.</p>
                <p className="text-xs mt-1">Switch to Manual Entry or create templates in Jobs settings.</p>
              </div>
            ) : (
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
            )}
          </TabsContent>
        </Tabs>
        )}

        {/* Scheduled Time Section - Only show for work shifts and manual mode */}
        {!isDayOff && entryMode === "manual" && (
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
        )}

        {/* Actual Hours Worked Section - Only show for work shifts */}
        {!isDayOff && (
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
                  {formatHours(Math.abs(formData.actual_hours - scheduledHours))}
                  {formData.actual_hours > scheduledHours && <span className="text-green-600"> (overtime)</span>}
                  {formData.actual_hours < scheduledHours && <span className="text-orange-600"> (undertime)</span>}
                </p>
              )}
            </div>
          )}
        </div>
        )}

        {/* Custom Hourly Rate Toggle - Only show for work shifts */}
        {!isDayOff && selectedJobId && selectedJobId !== "no-job" && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-show-custom-rate"
              checked={showCustomRate}
              onChange={(e) => {
                setShowCustomRate(e.target.checked);
                if (!e.target.checked) {
                  setFormData((prev) => ({ ...prev, custom_hourly_rate: 0 }));
                }
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="edit-show-custom-rate" className="text-sm font-normal cursor-pointer">
              Use custom hourly rate for this shift
            </Label>
          </div>
        )}

        {/* Custom Hourly Rate Input - Only show for work shifts */}
        {!isDayOff && (showCustomRate || !selectedJobId || selectedJobId === "no-job") && (
          <div className="space-y-2">
            <Label htmlFor="edit-custom-rate">
              Custom Hourly Rate {(!selectedJobId || selectedJobId === "no-job") && "*"}
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="edit-custom-rate"
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

        {/* Holiday Toggle and Multiplier - Only show for work shifts */}
        {!isDayOff && (
        <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-is-holiday"
              checked={formData.is_holiday}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_holiday: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="edit-is-holiday" className="text-sm font-normal cursor-pointer">
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
        )}

        {/* Custom Earnings Override - Only show for work shifts with a job that calculates earnings */}
        {!isDayOff && selectedJobId && selectedJobId !== "no-job" && calculatedEarnings !== null && (
          <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-use-custom-earnings"
                  checked={useCustomEarnings}
                  onCheckedChange={(checked) => {
                    setUseCustomEarnings(!!checked);
                    if (checked) {
                      // Initialize with calculated value
                      setCustomEarnings(calculatedEarnings?.toString() || "");
                    }
                  }}
                />
                <Label htmlFor="edit-use-custom-earnings" className="text-sm font-normal cursor-pointer">
                  Custom earnings amount
                </Label>
              </div>
              {!useCustomEarnings && calculatedEarnings !== null && (
                <span className="text-xs text-muted-foreground">
                  {shift?.jobs?.currency_symbol || '$'}{formatCurrency(calculatedEarnings)}
                </span>
              )}
            </div>

            {/* Show calculated earnings preview when NOT using custom */}
            {!useCustomEarnings && calculatedEarnings !== null && (
              <div className="pl-6 text-xs text-muted-foreground">
                Auto-calculated: {shift?.jobs?.currency_symbol || '$'}{formatCurrency(calculatedEarnings)}
                {formData.actual_hours > 0 && ` (${formData.actual_hours}h × rate)`}
              </div>
            )}

            {/* Custom earnings input (shown when checked) */}
            {useCustomEarnings && (
              <div className="space-y-2 pl-6 border-l-2 border-yellow-500">
                <Label htmlFor="edit-custom-earnings" className="text-xs">Earnings Amount</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{shift?.jobs?.currency_symbol || '$'}</span>
                  <Input
                    id="edit-custom-earnings"
                    type="number"
                    step="0.01"
                    min="0"
                    value={customEarnings}
                    onChange={(e) => setCustomEarnings(e.target.value)}
                    placeholder="Enter custom amount"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Manual amount will not recalculate when hours change
                </p>
                {calculatedEarnings !== null && (
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated would be: {shift?.jobs?.currency_symbol || '$'}{formatCurrency(calculatedEarnings)}
                  </p>
                )}
              </div>
            )}

            {/* Warning when editing previously-overridden shift */}
            {shift?.earnings_manual_override && !useCustomEarnings && (
              <div className="mt-2 rounded-md border border-yellow-500 bg-yellow-50 p-2">
                <p className="text-xs text-yellow-800">
                  ⚠️ This shift has custom earnings. Unchecking will recalculate
                  based on hours {calculatedEarnings !== null && `(${shift?.jobs?.currency_symbol || '$'}${formatCurrency(calculatedEarnings)})`}.
                </p>
              </div>
            )}
          </div>
        )}

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
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader>
            <DrawerTitle>Edit Shift</DrawerTitle>
            <DrawerDescription>
              Update shift details or delete
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto max-h-[calc(95vh-80px)]">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Shift</DialogTitle>
          <DialogDescription>
            Update shift details or delete
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">{content}</div>
      </DialogContent>
    </Dialog>
  );
}

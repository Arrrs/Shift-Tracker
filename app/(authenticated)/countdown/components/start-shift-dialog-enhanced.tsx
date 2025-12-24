"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/use-translation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import { createTimeEntry } from "../../time-entries/actions";

interface Job {
  id: string;
  name: string;
  pay_type: string;
  hourly_rate: number | null;
  daily_rate: number | null;
  currency: string | null;
  currency_symbol: string | null;
}

interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  expected_hours: number;
  break_duration: number | null;
}

interface StartShiftDialogEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function StartShiftDialogEnhanced({
  open,
  onOpenChange,
  onSuccess,
}: StartShiftDialogEnhancedProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Basic shift info
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [actualHours, setActualHours] = useState<number>(8);
  const [status, setStatus] = useState("in_progress");
  const [notes, setNotes] = useState("");
  const [breakDuration, setBreakDuration] = useState<number>(0);

  // Pay customization
  const [customizePay, setCustomizePay] = useState(false);
  const [payType, setPayType] = useState<"default" | "custom_hourly" | "custom_daily" | "fixed_amount">("default");
  const [customHourlyRate, setCustomHourlyRate] = useState<string>("0");
  const [customDailyRate, setCustomDailyRate] = useState<string>("0");
  const [fixedAmount, setFixedAmount] = useState<string>("0");
  const [applyMultiplier, setApplyMultiplier] = useState(false);
  const [holidayMultiplier, setHolidayMultiplier] = useState<string>("1.5");
  const [customMultiplierValue, setCustomMultiplierValue] = useState<string>("");
  const [customCurrency, setCustomCurrency] = useState<string>("USD");

  // Set default date and time when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);

      if (!selectedTemplateId) {
        const end = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        setStartTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
        setEndTime(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`);
      }
    }
  }, [open, selectedTemplateId]);

  // Load jobs when dialog opens
  useEffect(() => {
    if (open) {
      loadJobs();
    }
  }, [open]);

  // Load templates when job is selected
  useEffect(() => {
    if (selectedJobId) {
      loadTemplates(selectedJobId);
    } else {
      setTemplates([]);
      setSelectedTemplateId("");
    }
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
      setActualHours(Math.round(hours * 2) / 2); // Round to nearest 0.5
    }
  }, [startTime, endTime]);

  // Apply template
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setStartTime(template.start_time);
        setEndTime(template.end_time);
        setActualHours(template.expected_hours);
        setBreakDuration(template.break_duration || 0);
      }
    }
  }, [selectedTemplateId, templates]);

  const loadJobs = async () => {
    setLoadingData(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("jobs")
        .select("id, name, pay_type, hourly_rate, daily_rate, currency, currency_symbol")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setJobs(data || []);

      if (data && data.length === 1) {
        setSelectedJobId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoadingData(false);
    }
  };

  const loadTemplates = async (jobId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shift_templates")
        .select("id, name, start_time, end_time, expected_hours, break_duration")
        .eq("job_id", jobId)
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const getMultiplierValue = (): number => {
    if (holidayMultiplier === "custom") {
      return parseFloat(customMultiplierValue) || 0;
    }
    return parseFloat(holidayMultiplier) || 0;
  };

  const calculateExpectedIncome = () => {
    if (!customizePay) return null;

    const selectedJob = jobs.find(j => j.id === selectedJobId);
    const currencySymbol = payType === "default" && selectedJob
      ? selectedJob.currency_symbol
      : "$";

    let amount = 0;
    let formula = "";
    const multiplierValue = getMultiplierValue();

    if (payType === "fixed_amount") {
      amount = parseFloat(fixedAmount);
      formula = `Fixed: ${currencySymbol}${amount}`;
    } else if (payType === "custom_hourly") {
      const rate = parseFloat(customHourlyRate);
      amount = applyMultiplier ? rate * actualHours * multiplierValue : rate * actualHours;
      formula = applyMultiplier
        ? `${currencySymbol}${rate}/hr × ${actualHours}h × ${multiplierValue}x = ${currencySymbol}${amount.toFixed(2)}`
        : `${currencySymbol}${rate}/hr × ${actualHours}h = ${currencySymbol}${amount.toFixed(2)}`;
    } else if (payType === "custom_daily") {
      amount = applyMultiplier ? parseFloat(customDailyRate) * multiplierValue : parseFloat(customDailyRate);
      formula = applyMultiplier
        ? `${currencySymbol}${customDailyRate}/day × ${multiplierValue}x = ${currencySymbol}${amount.toFixed(2)}`
        : `${currencySymbol}${customDailyRate}/day`;
    } else if (payType === "default" && selectedJob) {
      if (selectedJob.pay_type === "hourly") {
        const rate = selectedJob.hourly_rate || 0;
        amount = applyMultiplier ? rate * actualHours * multiplierValue : rate * actualHours;
        formula = applyMultiplier
          ? `${currencySymbol}${rate}/hr × ${actualHours}h × ${multiplierValue}x = ${currencySymbol}${amount.toFixed(2)}`
          : `${currencySymbol}${rate}/hr × ${actualHours}h = ${currencySymbol}${amount.toFixed(2)}`;
      } else if (selectedJob.pay_type === "daily") {
        const rate = selectedJob.daily_rate || 0;
        amount = applyMultiplier ? rate * multiplierValue : rate;
        formula = applyMultiplier
          ? `${currencySymbol}${rate}/day × ${multiplierValue}x = ${currencySymbol}${amount.toFixed(2)}`
          : `${currencySymbol}${rate}/day`;
      }
    }

    return amount > 0 ? { amount, formula, symbol: currencySymbol } : null;
  };

  const handleSubmit = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job");
      return;
    }

    if (!startTime || !endTime) {
      toast.error("Please provide start and end times");
      return;
    }

    setLoading(true);
    try {
      const result = await createTimeEntry({
        job_id: selectedJobId,
        template_id: selectedTemplateId || null,
        date,
        start_time: startTime,
        end_time: endTime,
        entry_type: "work_shift",
        status,
        scheduled_hours: actualHours,
        actual_hours: actualHours,
        notes: notes || undefined,
        // Pay customization - using correct field names
        pay_override_type: customizePay && payType !== "default" ? payType : undefined,
        custom_hourly_rate: customizePay && payType === "custom_hourly" ? parseFloat(customHourlyRate) : undefined,
        custom_daily_rate: customizePay && payType === "custom_daily" ? parseFloat(customDailyRate) : undefined,
        holiday_fixed_amount: customizePay && payType === "fixed_amount" ? parseFloat(fixedAmount) : undefined,
        is_holiday: customizePay && applyMultiplier,
        holiday_multiplier: customizePay && applyMultiplier ? getMultiplierValue() : undefined,
      });

      if (result.error) {
        toast.error("Failed to start shift", { description: result.error });
      } else {
        toast.success("Shift started successfully");
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to start shift");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedJobId("");
    setSelectedTemplateId("");
    setNotes("");
    setCustomizePay(false);
    setPayType("default");
    setApplyMultiplier(false);
    setBreakDuration(0);
  };

  const expectedIncome = calculateExpectedIncome();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("startShiftNow")}</DialogTitle>
          <DialogDescription>
            Create and start tracking a new shift with full customization
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="time">Time & Hours</TabsTrigger>
              <TabsTrigger value="pay">Pay & Notes</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job">{t("job")} *</Label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger id="job">
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedJobId && templates.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="template">Template (Optional)</Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                  >
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Start from scratch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Start from scratch</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.start_time} - {template.end_time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="date">{t("date")} *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Time & Hours Tab */}
            <TabsContent value="time" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">{t("startTime")} *</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">{t("endTime")} *</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual-hours">{t("hours")}</Label>
                <Input
                  id="actual-hours"
                  type="number"
                  step="0.5"
                  value={actualHours}
                  onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-calculated from start and end time
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="break-duration">Break Duration (minutes)</Label>
                <Input
                  id="break-duration"
                  type="number"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(parseInt(e.target.value) || 0)}
                />
              </div>
            </TabsContent>

            {/* Pay & Notes Tab */}
            <TabsContent value="pay" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customize-pay"
                  checked={customizePay}
                  onCheckedChange={(checked) => setCustomizePay(checked as boolean)}
                />
                <Label htmlFor="customize-pay" className="cursor-pointer">
                  Customize payment for this shift
                </Label>
              </div>

              {customizePay && (
                <div className="space-y-4 border-l-2 border-border pl-4">
                  <div className="space-y-2">
                    <Label htmlFor="pay-type">Payment Type</Label>
                    <Select value={payType} onValueChange={(value: any) => setPayType(value)}>
                      <SelectTrigger id="pay-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Use job default rate</SelectItem>
                        <SelectItem value="custom_hourly">Custom hourly rate</SelectItem>
                        <SelectItem value="custom_daily">Custom daily rate</SelectItem>
                        <SelectItem value="fixed_amount">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {payType === "custom_hourly" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-hourly">Custom Hourly Rate</Label>
                      <Input
                        id="custom-hourly"
                        type="number"
                        step="0.01"
                        value={customHourlyRate}
                        onChange={(e) => setCustomHourlyRate(e.target.value)}
                      />
                    </div>
                  )}

                  {payType === "custom_daily" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-daily">Custom Daily Rate</Label>
                      <Input
                        id="custom-daily"
                        type="number"
                        step="0.01"
                        value={customDailyRate}
                        onChange={(e) => setCustomDailyRate(e.target.value)}
                      />
                    </div>
                  )}

                  {payType === "fixed_amount" && (
                    <div className="space-y-2">
                      <Label htmlFor="fixed-amount">Fixed Amount</Label>
                      <Input
                        id="fixed-amount"
                        type="number"
                        step="0.01"
                        value={fixedAmount}
                        onChange={(e) => setFixedAmount(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apply-multiplier"
                      checked={applyMultiplier}
                      onCheckedChange={(checked) => setApplyMultiplier(checked as boolean)}
                    />
                    <Label htmlFor="apply-multiplier" className="cursor-pointer">
                      Apply holiday/overtime multiplier
                    </Label>
                  </div>

                  {applyMultiplier && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="multiplier">Multiplier</Label>
                      <Select
                        value={holidayMultiplier}
                        onValueChange={setHolidayMultiplier}
                      >
                        <SelectTrigger id="multiplier">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.5">1.5x (Time and a half)</SelectItem>
                          <SelectItem value="2">2x (Double time)</SelectItem>
                          <SelectItem value="2.5">2.5x</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      {holidayMultiplier === "custom" && (
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Enter multiplier"
                          value={customMultiplierValue}
                          onChange={(e) => setCustomMultiplierValue(e.target.value)}
                        />
                      )}
                    </div>
                  )}

                  {expectedIncome && (
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <DollarSign className="h-4 w-4" />
                        Expected Income
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {expectedIncome.symbol}{expectedIncome.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {expectedIncome.formula}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">{t("notes")} (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this shift..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || loadingData}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Clock className="mr-2 h-4 w-4" />
            {t("startShiftNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

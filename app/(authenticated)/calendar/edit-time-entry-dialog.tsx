"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateTimeEntry, deleteTimeEntry } from "../time-entries/actions";
import { getShiftTemplates } from "../jobs/actions";
import { Database } from "@/lib/database.types";
import { DeleteTimeEntryButton } from "./delete-time-entry-button";
import { useActiveJobs } from "@/lib/hooks/use-jobs";
import { useQueryClient } from "@tanstack/react-query";
import { timeEntriesKeys } from "@/lib/hooks/use-time-entries";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type ShiftTemplate = Database["public"]["Tables"]["shift_templates"]["Row"];
type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];

interface EditTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: TimeEntry | null;
  onSuccess?: () => void;
}

export function EditTimeEntryDialog({ open, onOpenChange, entry, onSuccess }: EditTimeEntryDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Form state
  const [entryType, setEntryType] = useState<"work_shift" | "day_off">((entry?.entry_type as "work_shift" | "day_off") || "work_shift");
  const [selectedJobId, setSelectedJobId] = useState<string>(entry?.job_id || "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(entry?.template_id || "");
  const [date, setDate] = useState(entry?.date || "");
  const [startTime, setStartTime] = useState((entry?.start_time || "09:00").substring(0, 5));
  const [endTime, setEndTime] = useState((entry?.end_time || "17:00").substring(0, 5));
  const [actualHours, setActualHours] = useState<number>(entry?.actual_hours || 8);
  const [status, setStatus] = useState(entry?.status || "planned");
  const [notes, setNotes] = useState(entry?.notes || "");

  // Pay customization state
  const [customizePay, setCustomizePay] = useState(false);
  const [payType, setPayType] = useState<"default" | "custom_hourly" | "custom_daily" | "fixed_amount">("default");
  const [customHourlyRate, setCustomHourlyRate] = useState<string>("0");
  const [customDailyRate, setCustomDailyRate] = useState<string>("0");
  const [fixedAmount, setFixedAmount] = useState<string>("0");
  const [applyMultiplier, setApplyMultiplier] = useState(false);
  const [holidayMultiplier, setHolidayMultiplier] = useState<string>("1.5");
  const [customMultiplierValue, setCustomMultiplierValue] = useState<string>("");
  const [isHoliday, setIsHoliday] = useState(false);
  const [customCurrency, setCustomCurrency] = useState<string>("USD");

  // Day-off specific
  const [dayOffType, setDayOffType] = useState(entry?.day_off_type || "pto");
  const [isFullDay, setIsFullDay] = useState(entry?.is_full_day ?? true);
  const [dayOffHours, setDayOffHours] = useState(entry?.actual_hours || 8);

  // Load entry data when dialog opens
  useEffect(() => {
    if (entry && open) {
      setEntryType(entry.entry_type as "work_shift" | "day_off");
      setSelectedJobId(entry.job_id || "none");
      setSelectedTemplateId(entry.template_id || "none");
      setDate(entry.date);
      setStartTime((entry.start_time || "09:00").substring(0, 5));
      setEndTime((entry.end_time || "17:00").substring(0, 5));
      setActualHours(entry.actual_hours || 8);
      setStatus(entry.status || "planned");
      setNotes(entry.notes || "");
      setDayOffType(entry.day_off_type || "pto");
      setIsFullDay(entry.is_full_day ?? true);
      setDayOffHours(entry.actual_hours || 8);
      setCustomCurrency(entry.custom_currency || "USD");

      // Load pay customization data
      const hasPayCustomization =
        entry.pay_override_type ||
        entry.custom_hourly_rate ||
        entry.custom_daily_rate ||
        entry.holiday_fixed_amount ||
        entry.holiday_multiplier ||
        entry.is_holiday;

      if (hasPayCustomization) {
        setCustomizePay(true);

        // Set pay type
        if (entry.pay_override_type === "fixed_amount") {
          setPayType("fixed_amount");
          setFixedAmount(entry.holiday_fixed_amount?.toString() || "0");
        } else if (entry.pay_override_type === "holiday_multiplier") {
          setPayType("default");
          setApplyMultiplier(true);
          setHolidayMultiplier(entry.holiday_multiplier?.toString() || "1.5");
        } else if (entry.custom_hourly_rate) {
          setPayType("custom_hourly");
          setCustomHourlyRate(entry.custom_hourly_rate.toString());
        } else if (entry.custom_daily_rate) {
          setPayType("custom_daily");
          setCustomDailyRate(entry.custom_daily_rate.toString());
        }

        setIsHoliday(entry.is_holiday || false);
      } else {
        // Reset to defaults when no customization
        setCustomizePay(false);
        setPayType("default");
        setCustomHourlyRate("0");
        setCustomDailyRate("0");
        setFixedAmount("0");
        setApplyMultiplier(false);
        setHolidayMultiplier("1.5");
        setCustomMultiplierValue("");
        setIsHoliday(false);
      }
    }
  }, [entry, open]);

  // Load jobs with React Query (automatic caching & deduplication)
  const { data: activeJobs = [] } = useActiveJobs();

  // Load templates when job changes
  useEffect(() => {
    const loadTemplates = async () => {
      if (!selectedJobId || selectedJobId === "none") {
        setTemplates([]);
        return;
      }

      setLoadingTemplates(true);
      const result = await getShiftTemplates(selectedJobId);
      if (result.templates) {
        setTemplates(result.templates);
      } else {
        setTemplates([]);
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
      // Strip seconds from times (database returns HH:MM:SS)
      setStartTime(template.start_time.substring(0, 5));
      setEndTime(template.end_time.substring(0, 5));
      setActualHours(template.expected_hours);
      setSelectedTemplateId(templateId);
    }
  };

  // Get the actual multiplier value (handles "custom" case)
  const getMultiplierValue = (): number => {
    if (holidayMultiplier === "custom") {
      return parseFloat(customMultiplierValue) || 0;
    }
    return parseFloat(holidayMultiplier) || 0;
  };

  // Calculate expected income for live preview
  const getCurrencySymbolForPreview = () => {
    if (payType === "default" && selectedJobId && selectedJobId !== "none") {
      const selectedJob = activeJobs.find(j => j.id === selectedJobId);
      return selectedJob?.currency_symbol || "$";
    }
    // Map common currencies to symbols
    const symbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "$", AUD: "$",
      CHF: "CHF", CNY: "¥", INR: "₹", MXN: "$", BRL: "R$", ZAR: "R",
      RUB: "₽", KRW: "₩", SGD: "$"
    };
    return symbols[customCurrency] || "$";
  };

  const calculateExpectedIncome = (): { amount: number; formula: string; currency: string; symbol: string } | null => {
    if (!customizePay || entryType !== "work_shift") return null;

    const selectedJob = activeJobs.find(j => j.id === selectedJobId);
    const currencySymbol = getCurrencySymbolForPreview();
    const currencyCode = (payType === "default" && selectedJob ? selectedJob.currency : customCurrency) || "USD";
    let baseRate = 0;
    let rateLabel = "";
    let amount = 0;
    let formula = "";
    const multiplierValue = getMultiplierValue();

    // Determine base rate
    if (payType === "fixed_amount") {
      const fixed = parseFloat(fixedAmount);
      if (fixed > 0) {
        return { amount: fixed, formula: `Fixed: ${currencySymbol}${fixed}`, currency: currencyCode, symbol: currencySymbol };
      }
      return null;
    } else if (payType === "custom_hourly") {
      baseRate = parseFloat(customHourlyRate);
      rateLabel = "custom hourly";
    } else if (payType === "custom_daily") {
      const daily = parseFloat(customDailyRate);
      if (daily > 0) {
        amount = applyMultiplier && multiplierValue > 0
          ? daily * multiplierValue
          : daily;
        formula = applyMultiplier
          ? `${currencySymbol}${daily}/day × ${multiplierValue}x = ${currencySymbol}${amount.toFixed(2)}`
          : `${currencySymbol}${daily}/day`;
        return { amount, formula, currency: currencyCode, symbol: currencySymbol };
      }
      return null;
    } else if (payType === "default" && selectedJob) {
      if (selectedJob.pay_type === "hourly") {
        baseRate = selectedJob.hourly_rate || 0;
        rateLabel = "job hourly";
      } else if (selectedJob.pay_type === "daily") {
        const daily = selectedJob.daily_rate || 0;
        if (daily > 0) {
          amount = applyMultiplier && multiplierValue > 0
            ? daily * multiplierValue
            : daily;
          formula = applyMultiplier
            ? `${currencySymbol}${daily}/day × ${multiplierValue}x = ${currencySymbol}${amount.toFixed(2)}`
            : `${currencySymbol}${daily}/day`;
          return { amount, formula, currency: currencyCode, symbol: currencySymbol };
        }
        return null;
      }
    }

    // Calculate for hourly rates
    if (baseRate > 0 && actualHours > 0) {
      const multiplier = applyMultiplier && multiplierValue > 0 ? multiplierValue : 1;
      amount = actualHours * baseRate * multiplier;

      if (applyMultiplier && multiplier > 1) {
        formula = `${actualHours}h × ${currencySymbol}${baseRate}/h × ${multiplier}x = ${currencySymbol}${amount.toFixed(2)}`;
      } else {
        formula = `${actualHours}h × ${currencySymbol}${baseRate}/h = ${currencySymbol}${amount.toFixed(2)}`;
      }
      return { amount, formula, currency: currencyCode, symbol: currencySymbol };
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entry) return;

    if (entryType === "work_shift" && (!startTime || !endTime)) {
      toast.error(`${t("startTime")} / ${t("endTime")}`);
      return;
    }

    // Validate pay customization
    if (customizePay && entryType === "work_shift") {
      const hasJob = selectedJobId && selectedJobId !== "none";

      // Check if base rate is set
      if (payType !== "default" || applyMultiplier) {
        if (payType === "default" && !hasJob) {
          toast.error("Please select a job or set a custom rate");
          return;
        }

        if (payType === "custom_hourly" && !customHourlyRate) {
          toast.error("Please enter a custom hourly rate");
          return;
        }

        if (payType === "custom_daily" && !customDailyRate) {
          toast.error("Please enter a custom daily rate");
          return;
        }

        if (payType === "fixed_amount" && !fixedAmount) {
          toast.error("Please enter a fixed amount");
          return;
        }

        // Multiplier validation
        if (applyMultiplier) {
          const multiplierValue = getMultiplierValue();
          if (!multiplierValue || multiplierValue <= 0) {
            toast.error("Please enter a valid multiplier");
            return;
          }

          // If no job and multiplier is checked, need a base rate
          if (!hasJob && payType === "default") {
            toast.error("Multiplier requires a base rate", {
              description: "Please select custom hourly or daily rate first"
            });
            return;
          }
        }
      }
    }

    setLoading(true);

    const baseData = {
      date,
      status,
      notes: notes || undefined,
    };

    let result;

    if (entryType === "day_off") {
      result = await updateTimeEntry(entry.id, {
        ...baseData,
        entry_type: "day_off",
        day_off_type: dayOffType,
        actual_hours: isFullDay ? dayOffHours : dayOffHours,
        is_full_day: isFullDay,
        job_id: selectedJobId && selectedJobId !== "none" ? selectedJobId : null,
      });
    } else {
      const scheduledHours = actualHours; // For now, same as actual

      // Prepare pay customization fields - only include fields with valid values
      const payData: any = {
        is_holiday: isHoliday,
      };

      if (customizePay) {
        // Determine pay_override_type based on multiplier + base rate combination
        if (applyMultiplier) {
          payData.pay_override_type = "holiday_multiplier";
          const multiplier = getMultiplierValue();
          if (multiplier > 0) {
            payData.holiday_multiplier = multiplier;
          }
        } else {
          payData.pay_override_type = payType;
        }

        // Set base rate fields - only add if they have valid values
        switch (payType) {
          case "custom_hourly":
            const hourlyRate = parseFloat(customHourlyRate);
            if (!isNaN(hourlyRate) && hourlyRate > 0) {
              payData.custom_hourly_rate = hourlyRate;
            }
            break;
          case "custom_daily":
            const dailyRate = parseFloat(customDailyRate);
            if (!isNaN(dailyRate) && dailyRate > 0) {
              payData.custom_daily_rate = dailyRate;
            }
            break;
          case "fixed_amount":
            payData.pay_override_type = "fixed_amount";
            const fixedAmt = parseFloat(fixedAmount);
            if (!isNaN(fixedAmt) && fixedAmt > 0) {
              payData.holiday_fixed_amount = fixedAmt;
            }
            break;
          case "default":
            // Use job default, but if multiplier is applied, still set override type
            if (!applyMultiplier) {
              payData.pay_override_type = "default";
            }
            break;
        }

        // Always set custom currency when customizing pay
        if (customCurrency) {
          payData.custom_currency = customCurrency;
        }
      } else {
        payData.pay_override_type = "default";
      }

      // Strip seconds from times if present (database may return HH:MM:SS)
      const cleanStartTime = startTime.substring(0, 5);
      const cleanEndTime = endTime.substring(0, 5);

      result = await updateTimeEntry(entry.id, {
        ...baseData,
        entry_type: "work_shift",
        job_id: selectedJobId && selectedJobId !== "none" ? selectedJobId : null,
        template_id: selectedTemplateId && selectedTemplateId !== "none" ? selectedTemplateId : null,
        start_time: cleanStartTime,
        end_time: cleanEndTime,
        scheduled_hours: scheduledHours,
        actual_hours: actualHours,
        is_overnight: cleanEndTime <= cleanStartTime,
        ...payData,
      });
    }

    setLoading(false);

    if (result.error) {
      toast.error(t("error"), { description: result.error });
    } else {
      // Invalidate time entries cache to show updated entry
      await queryClient.invalidateQueries({ queryKey: timeEntriesKeys.lists() });
      toast.success(t("savedSuccessfully"));
      onOpenChange(false);
      onSuccess?.();
    }
  };

 

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle>{t("editShift")}</DialogTitle>
          <DialogDescription>{t("workShift")} / {t("dayOff")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 p-6 pt-4 overflow-y-auto flex-1">
          {/* Type Selector */}
          <div className="space-y-2">
            <Label>{t("type")}</Label>
            <Select value={entryType} onValueChange={(v) => setEntryType(v as "work_shift" | "day_off")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work_shift">💼 {t("workShift")}</SelectItem>
                <SelectItem value="day_off">🏖️ {t("dayOff")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">{t("date")} *</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          {/* Job Selection */}
          <div className="space-y-2">
            <Label>{t("job")} {entryType === "work_shift" && `(${t("optional")})`}</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectJob")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none")}</SelectItem>
                {activeJobs.map((job) => (
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
              {selectedJobId && selectedJobId !== "none" && templates.length > 0 && (
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
                  <Label htmlFor="start">{t("startTime")} *</Label>
                  <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">{t("endTime")} *</Label>
                  <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
              </div>

              {/* Hours */}
              <div className="space-y-2">
                <Label htmlFor="hours">{t("hoursWorked")} *</Label>
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

              {/* Pay Customization Toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="customize-pay"
                  checked={customizePay}
                  onChange={(e) => setCustomizePay(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="customize-pay" className="cursor-pointer font-medium">
                  Customize pay for this shift
                </Label>
              </div>

              {customizePay && (
                <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                  {/* Currency Selection */}
                  <div>
                    <Label htmlFor="custom-currency" className="text-sm font-medium mb-2 block">
                      Currency {selectedJobId && selectedJobId !== "none" && payType === "default" && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">(overrides job default)</span>
                      )}
                    </Label>
                    <Select value={customCurrency} onValueChange={setCustomCurrency}>
                      <SelectTrigger id="custom-currency" className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="EUR">€ EUR</SelectItem>
                        <SelectItem value="GBP">£ GBP</SelectItem>
                        <SelectItem value="JPY">¥ JPY</SelectItem>
                        <SelectItem value="CAD">$ CAD</SelectItem>
                        <SelectItem value="AUD">$ AUD</SelectItem>
                        <SelectItem value="CHF">CHF</SelectItem>
                        <SelectItem value="CNY">¥ CNY</SelectItem>
                        <SelectItem value="INR">₹ INR</SelectItem>
                        <SelectItem value="MXN">$ MXN</SelectItem>
                        <SelectItem value="BRL">R$ BRL</SelectItem>
                        <SelectItem value="ZAR">R ZAR</SelectItem>
                        <SelectItem value="RUB">₽ RUB</SelectItem>
                        <SelectItem value="KRW">₩ KRW</SelectItem>
                        <SelectItem value="SGD">$ SGD</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedJobId && selectedJobId !== "none"
                        ? "This currency will be used for this shift instead of the job default"
                        : "Currency for this freelance work"}
                    </p>
                  </div>

                  {/* Base Rate Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Base Rate</Label>
                    <div className="space-y-2.5">
                      {selectedJobId && selectedJobId !== "none" && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="pay-default"
                            checked={payType === "default"}
                            onChange={() => setPayType("default")}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="pay-default" className="cursor-pointer font-normal">
                            Use job default ({activeJobs.find(j => j.id === selectedJobId)?.pay_type === "hourly"
                              ? `$${activeJobs.find(j => j.id === selectedJobId)?.hourly_rate}/hr`
                              : activeJobs.find(j => j.id === selectedJobId)?.pay_type === "daily"
                              ? `$${activeJobs.find(j => j.id === selectedJobId)?.daily_rate}/day`
                              : "N/A"})
                          </Label>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="pay-hourly"
                          checked={payType === "custom_hourly"}
                          onChange={() => setPayType("custom_hourly")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="pay-hourly" className="cursor-pointer font-normal flex-shrink-0">Custom hourly</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={customHourlyRate}
                          onChange={(e) => setCustomHourlyRate(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          disabled={payType !== "custom_hourly"}
                          className="w-24 h-8"
                        />
                        <span className="text-sm text-muted-foreground">$/hr</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="pay-daily"
                          checked={payType === "custom_daily"}
                          onChange={() => setPayType("custom_daily")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="pay-daily" className="cursor-pointer font-normal flex-shrink-0">Custom daily</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={customDailyRate}
                          onChange={(e) => setCustomDailyRate(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          disabled={payType !== "custom_daily"}
                          className="w-24 h-8"
                        />
                        <span className="text-sm text-muted-foreground">$/day</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="pay-fixed"
                          checked={payType === "fixed_amount"}
                          onChange={() => setPayType("fixed_amount")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="pay-fixed" className="cursor-pointer font-normal flex-shrink-0">Fixed amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={fixedAmount}
                          onChange={(e) => setFixedAmount(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          disabled={payType !== "fixed_amount"}
                          className="w-24 h-8"
                        />
                        <span className="text-sm text-muted-foreground">$ total</span>
                      </div>
                    </div>
                  </div>

                  {/* Multiplier Checkbox */}
                  {payType !== "fixed_amount" && (
                    <div className="border-t pt-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <input
                          type="checkbox"
                          id="apply-multiplier"
                          checked={applyMultiplier}
                          onChange={(e) => setApplyMultiplier(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="apply-multiplier" className="cursor-pointer font-normal">
                          Apply holiday/overtime multiplier
                        </Label>
                      </div>
                      {applyMultiplier && (
                        <div className="flex items-center gap-2 ml-6">
                          <Select value={holidayMultiplier} onValueChange={setHolidayMultiplier}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1.25">1.25x</SelectItem>
                              <SelectItem value="1.5">1.5x (Time and a half)</SelectItem>
                              <SelectItem value="1.75">1.75x</SelectItem>
                              <SelectItem value="2.0">2.0x (Double time)</SelectItem>
                              <SelectItem value="2.5">2.5x</SelectItem>
                              <SelectItem value="3.0">3.0x (Triple time)</SelectItem>
                              <SelectItem value="custom">Custom...</SelectItem>
                            </SelectContent>
                          </Select>
                          {holidayMultiplier === "custom" && (
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={customMultiplierValue}
                              placeholder="e.g., 1.75"
                              onChange={(e) => setCustomMultiplierValue(e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-24"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Live Income Preview */}
                  {(() => {
                    const preview = calculateExpectedIncome();
                    return preview ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <div className="text-xs font-medium text-emerald-900 dark:text-emerald-100 mb-1">Expected Income</div>
                        <div className="flex items-baseline gap-1">
                          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{preview.symbol}{preview.amount.toFixed(2)}</div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400">{preview.currency}</div>
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{preview.formula}</div>
                      </div>
                    ) : null;
                  })()}

                  {/* Holiday Marker */}
                  <div className="flex items-center space-x-2 border-t pt-3">
                    <input
                      type="checkbox"
                      id="is-holiday"
                      checked={isHoliday}
                      onChange={(e) => setIsHoliday(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is-holiday" className="cursor-pointer font-normal">
                      🎉 Mark as holiday shift (for tracking only)
                    </Label>
                  </div>
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
            <Label>{t("status")}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">{t("plannedStatus")}</SelectItem>
                <SelectItem value="in_progress">{t("inProgressStatus")}</SelectItem>
                <SelectItem value="completed">{t("completedStatus")}</SelectItem>
                <SelectItem value="cancelled">{t("cancelledStatus")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t("notes")} ({t("optional")})</Label>
            <Input id="notes" placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          </div>

          {/* Actions */}
          <DialogFooter className="pt-4 px-6 pb-6 mt-0 border-t flex-shrink-0">
            {/* <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting} className="flex-shrink-0">
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("delete")}
                </>
              )}
            </Button> */}
            <DeleteTimeEntryButton
              entryId={entry.id}
              onSuccess={() => {
                toast.success(t("deletedSuccessfully"));
                onOpenChange(false);
                onSuccess?.();
              }}
              onError={(error) => {
                toast.error(t("error"), { description: error });
              }}
            />
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("saveChanges")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

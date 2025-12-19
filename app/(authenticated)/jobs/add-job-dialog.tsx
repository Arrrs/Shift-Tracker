"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createJob } from "./actions";
import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "UAH", label: "UAH - Ukrainian Hryvnia" },
  { value: "CZK", label: "CZK - Czech Koruna" },
  { value: "PLN", label: "PLN - Polish Złoty" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "DKK", label: "DKK - Danish Krone" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "HUF", label: "HUF - Hungarian Forint" },
  { value: "NOK", label: "NOK - Norwegian Krone" },
  { value: "RON", label: "RON - Romanian Leu" },
  { value: "SEK", label: "SEK - Swedish Krona" },
];

interface AddJobDialogProps {
  onSuccess?: () => void;
}

export function AddJobDialog({ onSuccess }: AddJobDialogProps = {}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    pay_type: "hourly",
    hourly_rate: "",
    daily_rate: "",
    monthly_salary: "",
    currency: "USD",
    color: "#3b82f6",
    description: "",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createJob({
      name: formData.name,
      pay_type: formData.pay_type,
      hourly_rate:
        formData.pay_type === "hourly" && formData.hourly_rate
          ? parseFloat(formData.hourly_rate)
          : null,
      daily_rate:
        formData.pay_type === "daily" && formData.daily_rate
          ? parseFloat(formData.daily_rate)
          : null,
      monthly_salary:
        (formData.pay_type === "monthly" || formData.pay_type === "salary") &&
        formData.monthly_salary
          ? parseFloat(formData.monthly_salary)
          : null,
      currency: formData.currency,
      color: formData.color,
      description: formData.description || null,
      is_active: formData.is_active,
    });

    setLoading(false);

    if (result.error) {
      toast.error(t("failedToCreateJob"), {
        description: result.error,
      });
    } else {
      setOpen(false);
      toast.success(t("jobCreatedSuccessfully"));
      // Reset form
      setFormData({
        name: "",
        pay_type: "hourly",
        hourly_rate: "",
        daily_rate: "",
        monthly_salary: "",
        currency: "USD",
        color: "#3b82f6",
        description: "",
        is_active: true,
      });
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          <div className="hidden md:block">{t("addJob")}</div>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("addNewJob")}</DialogTitle>
            <DialogDescription>{t("createNewJobToTrack")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Job Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">{t("jobName")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. McDonald's"
                required
              />
            </div>

            {/* Pay Type */}
            <div className="grid gap-2">
              <Label htmlFor="pay_type">{t("payType")} *</Label>
              <Select
                value={formData.pay_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, pay_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectPayType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">{t("hourlyRate")}</SelectItem>
                  <SelectItem value="daily">{t("dailyRate")}</SelectItem>
                  <SelectItem value="monthly">{t("monthlySalary")}</SelectItem>
                  <SelectItem value="salary">{t("annualSalary")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rate Input - Dynamic based on pay type */}
            {formData.pay_type === "hourly" && (
              <div className="grid gap-2">
                <Label htmlFor="hourly_rate">{t("hourlyRate")} *</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                  placeholder="15.50"
                  required
                />
              </div>
            )}

            {formData.pay_type === "daily" && (
              <div className="grid gap-2">
                <Label htmlFor="daily_rate">{t("dailyRate")} *</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  step="0.01"
                  value={formData.daily_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, daily_rate: e.target.value })
                  }
                  placeholder="120.00"
                  required
                />
              </div>
            )}

            {(formData.pay_type === "monthly" ||
              formData.pay_type === "salary") && (
              <div className="grid gap-2">
                <Label htmlFor="monthly_salary">
                  {formData.pay_type === "salary"
                    ? t("annualSalary")
                    : t("monthlySalary")}{" "}
                  *
                </Label>
                <Input
                  id="monthly_salary"
                  type="number"
                  step="0.01"
                  value={formData.monthly_salary}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_salary: e.target.value })
                  }
                  placeholder={
                    formData.pay_type === "salary" ? "45000.00" : "3000.00"
                  }
                  required
                />
              </div>
            )}

            {/* Currency */}
            <div className="grid gap-2">
              <Label htmlFor="currency">{t("currency")}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCurrency")} />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("optionalNotes")}
              />
            </div>

            {/* Color Picker */}
            <div className="grid gap-2">
              <Label htmlFor="color">{t("jobColor")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground font-mono">
                  {formData.color}
                </span>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">{t("activeStatus")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("jobIsActive")}
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("creating") : t("createJob")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

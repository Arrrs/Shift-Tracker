"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    pay_type: "hourly",
    hourly_rate: "",
    daily_rate: "",
    monthly_rate: "",
    annual_salary: "",
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
      hourly_rate: formData.pay_type === "hourly" && formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      daily_rate: formData.pay_type === "daily" && formData.daily_rate ? parseFloat(formData.daily_rate) : null,
      monthly_rate: formData.pay_type === "monthly" && formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
      annual_salary: formData.pay_type === "salary" && formData.annual_salary ? parseFloat(formData.annual_salary) : null,
      currency: formData.currency,
      color: formData.color,
      description: formData.description || null,
      is_active: formData.is_active,
    });

    setLoading(false);

    if (result.error) {
      toast.error("Failed to create job", {
        description: result.error
      });
    } else {
      setOpen(false);
      toast.success("Job created successfully");
      // Reset form
      setFormData({
        name: "",
        pay_type: "hourly",
        hourly_rate: "",
        daily_rate: "",
        monthly_rate: "",
        annual_salary: "",
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
          <Plus /> Add Job
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Job</DialogTitle>
            <DialogDescription>
              Create a new job to track shifts and earnings
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Job Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Job Name *</Label>
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
              <Label htmlFor="pay_type">Pay Type *</Label>
              <Select
                value={formData.pay_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, pay_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pay type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="daily">Daily Rate</SelectItem>
                  <SelectItem value="monthly">Monthly Rate</SelectItem>
                  <SelectItem value="salary">Annual Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rate Input - Dynamic based on pay type */}
            {formData.pay_type === "hourly" && (
              <div className="grid gap-2">
                <Label htmlFor="hourly_rate">Hourly Rate *</Label>
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
                <Label htmlFor="daily_rate">Daily Rate *</Label>
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

            {formData.pay_type === "monthly" && (
              <div className="grid gap-2">
                <Label htmlFor="monthly_rate">Monthly Rate *</Label>
                <Input
                  id="monthly_rate"
                  type="number"
                  step="0.01"
                  value={formData.monthly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_rate: e.target.value })
                  }
                  placeholder="3000.00"
                  required
                />
              </div>
            )}

            {formData.pay_type === "salary" && (
              <div className="grid gap-2">
                <Label htmlFor="annual_salary">Annual Salary *</Label>
                <Input
                  id="annual_salary"
                  type="number"
                  step="0.01"
                  value={formData.annual_salary}
                  onChange={(e) =>
                    setFormData({ ...formData, annual_salary: e.target.value })
                  }
                  placeholder="45000.00"
                  required
                />
              </div>
            )}

            {/* Currency */}
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
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
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional notes"
              />
            </div>

            {/* Color Picker */}
            <div className="grid gap-2">
              <Label htmlFor="color">Job Color</Label>
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
                <Label htmlFor="is_active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Job is currently active and accepting shifts
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

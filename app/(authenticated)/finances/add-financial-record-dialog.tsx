"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { createFinancialRecord, getCategories } from "./actions";
import { getJobs } from "../jobs/actions";
import { toast } from "sonner";

interface AddFinancialRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  defaultType?: "income" | "expense";
}

export function AddFinancialRecordDialog({
  open,
  onOpenChange,
  selectedDate,
  defaultType = "income",
}: AddFinancialRecordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [type, setType] = useState<"income" | "expense">(defaultType);

  const [formData, setFormData] = useState({
    amount: "",
    currency: "USD",
    date: selectedDate?.toISOString().split("T")[0] || "",
    category_id: "",
    description: "",
    notes: "",
    job_id: "",
  });

  // Load categories when type changes
  useEffect(() => {
    async function loadCategories() {
      const { categories: cats, error } = await getCategories(type);
      if (!error && cats) {
        setCategories(cats);
        // Auto-select first category if available
        if (cats.length > 0 && !formData.category_id) {
          setFormData((prev) => ({ ...prev, category_id: cats[0].id }));
        }
      }
    }
    loadCategories();
  }, [type]);

  // Load jobs once
  useEffect(() => {
    async function loadJobs() {
      const { jobs: jobsList, error } = await getJobs();
      if (!error && jobsList) {
        setJobs(jobsList);
      }
    }
    loadJobs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        setLoading(false);
        return;
      }

      const result = await createFinancialRecord({
        type,
        amount,
        currency: formData.currency,
        date: formData.date,
        category_id: formData.category_id || null,
        description: formData.description,
        notes: formData.notes || null,
        job_id: formData.job_id || null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${type === "income" ? "Income" : "Expense"} record added`);
        onOpenChange(false);
        // Reset form
        setFormData({
          amount: "",
          currency: "USD",
          date: selectedDate?.toISOString().split("T")[0] || "",
          category_id: categories[0]?.id || "",
          description: "",
          notes: "",
          job_id: "",
        });
      }
    } catch (error) {
      toast.error("Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Financial Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup
              value={type}
              onValueChange={(value: string) => {
                setType(value as "income" | "expense");
                setFormData((prev) => ({ ...prev, category_id: "" }));
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="cursor-pointer">
                  💰 Income
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="cursor-pointer">
                  💸 Expense
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">$ USD</SelectItem>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                  <SelectItem value="GBP">£ GBP</SelectItem>
                  <SelectItem value="UAH">₴ UAH</SelectItem>
                  <SelectItem value="PLN">zł PLN</SelectItem>
                  <SelectItem value="CZK">Kč CZK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="What was this for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Link to Job (optional) */}
          <div className="space-y-2">
            <Label htmlFor="job">Link to Job (optional)</Label>
            <Select
              value={formData.job_id}
              onValueChange={(value) => setFormData({ ...formData, job_id: value })}
            >
              <SelectTrigger id="job">
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

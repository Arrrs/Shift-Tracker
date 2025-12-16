"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Trash2 } from "lucide-react";
import { updateFinancialRecord, deleteFinancialRecord, getCategories } from "../finances/actions";
import { getJobs } from "../jobs/actions";
import { toast } from "sonner";
import { Database } from "@/lib/database.types";

type FinancialRecord = Database["public"]["Tables"]["financial_records"]["Row"] & {
  financial_categories?: Database["public"]["Tables"]["financial_categories"]["Row"] | null;
  jobs?: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

interface EditFinancialRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: FinancialRecord | null;
  onSuccess?: () => void;
}

export function EditFinancialRecordDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: EditFinancialRecordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [type, setType] = useState<"income" | "expense">("income");

  const [formData, setFormData] = useState({
    amount: "",
    currency: "USD",
    date: "",
    category_id: "",
    description: "",
    notes: "",
    job_id: "",
  });

  // Load record data when dialog opens
  useEffect(() => {
    if (record && open) {
      setType(record.type as "income" | "expense");
      setFormData({
        amount: record.amount.toString(),
        currency: record.currency,
        date: record.date,
        category_id: record.category_id || "",
        description: record.description,
        notes: record.notes || "",
        job_id: record.job_id || "",
      });
    }
  }, [record, open]);

  // Load categories when type changes
  useEffect(() => {
    async function loadCategories() {
      const { categories: cats, error } = await getCategories(type);
      if (!error && cats) {
        setCategories(cats);
      }
    }
    if (open) {
      loadCategories();
    }
  }, [type, open]);

  // Load jobs once
  useEffect(() => {
    async function loadJobs() {
      const { jobs: jobsList, error } = await getJobs();
      if (!error && jobsList) {
        setJobs(jobsList.filter(job => job.is_active));
      }
    }
    if (open) {
      loadJobs();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!record) return;

    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        setLoading(false);
        return;
      }

      const result = await updateFinancialRecord(record.id, {
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
        toast.success(`${type === "income" ? "Income" : "Expense"} updated`);
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      toast.error("Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;

    const confirmed = confirm(`Are you sure you want to delete this ${type} record?`);
    if (!confirmed) return;

    setDeleting(true);

    const result = await deleteFinancialRecord(record.id);

    setDeleting(false);

    if (result.error) {
      toast.error("Failed to delete record", { description: result.error });
    } else {
      toast.success("Record deleted");
      onOpenChange(false);
      onSuccess?.();
    }
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Financial Record</DialogTitle>
          <DialogDescription>Update income or expense details</DialogDescription>
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
                <RadioGroupItem value="income" id="income-edit" />
                <Label htmlFor="income-edit" className="cursor-pointer">
                  💰 Income
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense-edit" />
                <Label htmlFor="expense-edit" className="cursor-pointer">
                  💸 Expense
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount-edit">Amount</Label>
              <Input
                id="amount-edit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency-edit">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger id="currency-edit">
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
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date-edit">Date</Label>
            <Input
              id="date-edit"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category-edit">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger id="category-edit">
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
            <Label htmlFor="description-edit">Description</Label>
            <Input
              id="description-edit"
              type="text"
              placeholder="What was this for?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes-edit">Notes (optional)</Label>
            <Textarea
              id="notes-edit"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Link to Job (optional) */}
          <div className="space-y-2">
            <Label htmlFor="job-edit">Link to Job (optional)</Label>
            <Select
              value={formData.job_id}
              onValueChange={(value) => setFormData({ ...formData, job_id: value })}
            >
              <SelectTrigger id="job-edit">
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
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

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-shrink-0"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
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
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

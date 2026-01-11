"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/responsive-modal";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Trash2 } from "lucide-react";
import { updateFinancialRecord, deleteFinancialRecord } from "../finances/actions";
import { useActiveJobs } from "@/lib/hooks/use-jobs";
import { useCategories } from "@/lib/hooks/use-categories";
import { toast } from "sonner";
import { Database } from "@/lib/database.types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { financialRecordsKeys } from "@/lib/hooks/use-financial-records";

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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("income");
  const { data: categories = [] } = useCategories(type);
  const { data: activeJobs = [] } = useActiveJobs();

  const [formData, setFormData] = useState({
    amount: "",
    currency: "USD",
    date: "",
    category_id: "",
    description: "",
    notes: "",
    job_id: "",
    status: "completed" as "completed" | "planned" | "cancelled",
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
        status: (record.status || "completed") as "completed" | "planned" | "cancelled",
      });
    }
  }, [record, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!record) return;

    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error(t("pleaseEnterValidAmount"));
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
        status: formData.status,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        // Invalidate financial records cache to show updated record
        await queryClient.invalidateQueries({ queryKey: financialRecordsKeys.lists() });
        toast.success(type === "income" ? t("incomeUpdated") : t("expenseUpdated"));
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      toast.error(t("failedToUpdateRecord"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!record) return;

    setDeleting(true);

    const result = await deleteFinancialRecord(record.id);

    setDeleting(false);

    if (result.error) {
      toast.error(t("failedToDeleteRecord"), { description: result.error });
    } else {
      // Invalidate financial records cache to remove deleted record
      await queryClient.invalidateQueries({ queryKey: financialRecordsKeys.lists() });
      toast.success(t("recordDeleted"));
      setDeleteDialogOpen(false);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle>{t("editFinancialRecord")}</DialogTitle>
          <DialogDescription>{t("updateIncomeOrExpense")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 p-6 pt-4 overflow-y-auto flex-1">
          {/* Type */}
          <div className="space-y-2">
            <Label>{t("type")}</Label>
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
                  💰 {t("income")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense-edit" />
                <Label htmlFor="expense-edit" className="cursor-pointer">
                  💸 {t("expense")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status-edit">{t("status")}</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "completed" | "planned" | "cancelled") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger id="status-edit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">{t("completedStatus")}</SelectItem>
                <SelectItem value="planned">{t("plannedStatus")}</SelectItem>
                <SelectItem value="cancelled">{t("cancelledStatus")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount-edit">{t("amount")}</Label>
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
              <Label htmlFor="currency-edit">{t("currency")}</Label>
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
            <Label htmlFor="date-edit">{t("date")}</Label>
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
            <Label htmlFor="category-edit">{t("category")}</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger id="category-edit">
                <SelectValue placeholder={t("selectCategory")} />
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
            <Label htmlFor="description-edit">{t("description")}</Label>
            <Input
              id="description-edit"
              type="text"
              placeholder={t("whatWasThisFor")}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes-edit">{t("notes")} ({t("optional")})</Label>
            <Textarea
              id="notes-edit"
              placeholder={t("additionalDetails")}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Link to Job (optional) */}
          <div className="space-y-2">
            <Label htmlFor="job-edit">{t("linkToJob")} ({t("optional")})</Label>
            <Select
              value={formData.job_id}
              onValueChange={(value) => setFormData({ ...formData, job_id: value })}
            >
              <SelectTrigger id="job-edit">
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
          </div>

          {/* Actions */}
          <DialogFooter className="pt-4 px-6 pb-6 mt-0 border-t flex-shrink-0">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={loading || deleting}
              className="flex-shrink-0"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRecord")} {type === "income" ? t("income") : t("expense")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteRecordConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

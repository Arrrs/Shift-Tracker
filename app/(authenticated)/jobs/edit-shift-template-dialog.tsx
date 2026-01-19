"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { useUpdateShiftTemplate } from "@/lib/hooks/use-shift-templates";
import { Database } from "@/lib/database.types";
import { useTranslation } from "@/lib/i18n/use-translation";

type ShiftTemplate = Database["public"]["Tables"]["shift_templates"]["Row"];

interface EditShiftTemplateDialogProps {
  template: ShiftTemplate;
  variant?: "link" | "ghost";
  size?: "sm";
  onSuccess?: () => void;
}

export function EditShiftTemplateDialog({
  template,
  variant = "link",
  size,
  onSuccess,
}: EditShiftTemplateDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const updateMutation = useUpdateShiftTemplate();
  const [formData, setFormData] = useState({
    name: template.name,
    short_code: template.short_code || "",
    start_time: template.start_time,
    end_time: template.end_time,
    expected_hours: template.expected_hours,
    color: template.color || "#3B82F6",
  });

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;

    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    let hours = endHour - startHour;
    let minutes = endMin - startMin;

    // Handle overnight shifts
    if (hours < 0) {
      hours += 24;
    }

    return hours + (minutes / 60);
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-calculate expected hours
    const calculatedHours = calculateHours(
      field === 'start_time' ? value : formData.start_time,
      field === 'end_time' ? value : formData.end_time
    );

    setFormData({
      ...newFormData,
      expected_hours: Math.round(calculatedHours * 2) / 2, // Round to nearest 0.5
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await updateMutation.mutateAsync({
      templateId: template.id,
      data: {
        ...formData,
        expected_hours: formData.expected_hours,
      },
    });

    if (!result.error) {
      setOpen(false);
      onSuccess?.();
    }
  };

  const loading = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Pencil className={size === "sm" ? "h-4 w-4" : undefined} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle>{t("editShiftTemplate")}</DialogTitle>
          <DialogDescription>
            {t("updateTemplateDetails")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-4 p-6 pt-4 overflow-y-auto flex-1">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">{t("templateName")}</Label>
              <Input
                id="name"
                placeholder={t("templateNamePlaceholder")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Short Code */}
            <div className="grid gap-2">
              <Label htmlFor="short_code">{t("shortCodeOptional")}</Label>
              <Input
                id="short_code"
                placeholder={t("shortCodePlaceholder")}
                maxLength={3}
                value={formData.short_code}
                onChange={(e) =>
                  setFormData({ ...formData, short_code: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground">
                {t("shortCodeHint")}
              </p>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_time">{t("startTime")}</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleTimeChange('start_time', e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end_time">{t("endTime")}</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleTimeChange('end_time', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Expected Hours */}
            <div className="grid gap-2">
              <Label htmlFor="expected_hours">{t("expectedHours")}</Label>
              <Input
                id="expected_hours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.expected_hours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expected_hours: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            {/* Color Picker */}
            <div className="grid gap-2">
              <Label htmlFor="color">{t("templateColor")}</Label>
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
          </div>

          <DialogFooter className="pt-4 px-6 pb-6 mt-0 border-t flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("savingTemplate") : t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { Plus } from "lucide-react";
import { useCreateShiftTemplate } from "@/lib/hooks/use-shift-templates";
import { useTranslation } from "@/lib/i18n/use-translation";

interface AddShiftTemplateDialogProps {
  jobId: string;
  onSuccess?: () => void;
}

export function AddShiftTemplateDialog({ jobId, onSuccess }: AddShiftTemplateDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const createMutation = useCreateShiftTemplate();
  const [formData, setFormData] = useState({
    name: "",
    short_code: "",
    start_time: "09:00",
    end_time: "17:00",
    expected_hours: 8,
    color: "#3B82F6",
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

    const result = await createMutation.mutateAsync({ jobId, data: formData });

    if (!result.error) {
      setOpen(false);
      // Reset form
      setFormData({
        name: "",
        short_code: "",
        start_time: "09:00",
        end_time: "17:00",
        expected_hours: 8,
        color: "#3B82F6",
      });
      onSuccess?.();
    }
  };

  const loading = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {t("addTemplate")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle>{t("addShiftTemplate")}</DialogTitle>
          <DialogDescription>
            {t("createReusableTemplate")}
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
                    expected_hours: parseFloat(e.target.value),
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
              {loading ? t("creatingTemplate") : t("createTemplate")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

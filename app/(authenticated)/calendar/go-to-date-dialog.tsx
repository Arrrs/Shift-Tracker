"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";

interface GoToDateDialogProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function GoToDateDialog({ currentDate, onDateChange }: GoToDateDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // Sync with current date when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedMonth(currentDate.getMonth().toString());
      setSelectedYear(currentDate.getFullYear().toString());
    }
  }, [open, currentDate]);

  const months = [
    t("monthJanuary"), t("monthFebruary"), t("monthMarch"), t("monthApril"),
    t("monthMay"), t("monthJune"), t("monthJuly"), t("monthAugust"),
    t("monthSeptember"), t("monthOctober"), t("monthNovember"), t("monthDecember")
  ];

  // Generate years from 10 years ago to 10 years ahead (21 years total)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const handleGoToDate = () => {
    const newDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
    onDateChange(newDate);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarDays className="h-4 w-4 mr-0" />
          {/* Go to Date */}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 flex flex-col max-h-[90vh] overflow-hidden w-full">
        <DialogHeader className="p-4 sm:p-6 pb-0 flex-shrink-0">
          <DialogTitle>Go to Date</DialogTitle>
          <DialogDescription>
            Jump to a specific month and year
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4 sm:p-6 pt-4 overflow-y-auto flex-1">
          {/* Month Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleGoToDate} className="flex-1">
              Go
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

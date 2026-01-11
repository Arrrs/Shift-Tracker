"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { Database } from "@/lib/database.types";
import { ShiftTemplatesList } from "./shift-templates-list";
import { getCurrencySymbol } from "@/lib/utils/time-format";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

interface JobDetailsDrawerProps {
  job: Job;
  variant?: "link" | "ghost";
  size?: "sm";
  children?: React.ReactNode;
  onTemplateChange?: () => void;
}

export function JobDetailsDrawer({
  job,
  variant = "link",
  size,
  children,
  onTemplateChange,
}: JobDetailsDrawerProps) {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Helper function to format currency values (removes trailing zeros)
  const formatCurrencyValue = (value: number | null | undefined): string => {
    if (!value) return '0';
    // Remove trailing zeros and unnecessary decimal point
    return value.toFixed(2).replace(/\.?0+$/, '');
  };

  // Format rate display based on pay_type
  const getRateDisplay = () => {
    const symbol = getCurrencySymbol(job.currency || 'USD');

    switch (job.pay_type) {
      case 'daily':
        return {
          label: 'Daily Rate',
          value: `${symbol} ${formatCurrencyValue(job.daily_rate)} ${job.currency || 'USD'}`
        };
      case 'monthly':
        return {
          label: 'Monthly Salary',
          value: `${symbol} ${formatCurrencyValue(job.monthly_salary)} ${job.currency || 'USD'}`
        };
      case 'salary':
        return {
          label: 'Annual Salary',
          value: `${symbol} ${Math.round(job.monthly_salary || 0)} ${job.currency || 'USD'}`
        };
      case 'hourly':
      default:
        return {
          label: 'Hourly Rate',
          value: `${symbol} ${formatCurrencyValue(job.hourly_rate)} ${job.currency || 'USD'}`
        };
    }
  };

  const rateDisplay = getRateDisplay();

  const jobDetails = (
    <div className="px-4 pb-4 space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Status
            </h3>
            <Badge variant={job.is_active ? "default" : "secondary"}>
              {job.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Rate */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {rateDisplay.label}
            </h3>
            <p className="text-2xl font-semibold">
              {rateDisplay.value}
            </p>
          </div>

          {/* Description */}
          {job.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-sm">{job.description}</p>
            </div>
          )}

          {/* Color */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Color
            </h3>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: job.color || "#3B82F6" }}
              />
              <span className="text-sm font-mono">{job.color || "#3B82F6"}</span>
            </div>
          </div>

          {/* Created Date */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Created
            </h3>
            <p className="text-sm">
              {job.created_at && new Date(job.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Shift Templates Section */}
          <ShiftTemplatesList jobId={job.id} onTemplateChange={onTemplateChange} />
        </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button variant={variant} size={size} title="View details and manage templates">
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{job.name}</DialogTitle>
            <DialogDescription>Job details and information</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1">
            {jobDetails}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {children || (
          <Button variant={variant} size={size} title="View details and manage templates">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DrawerTrigger>

      <DrawerContent className="max-h-[80vh] overflow-hidden flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{job.name}</DrawerTitle>
          <DrawerDescription>Job details and information</DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto flex-1">
          {jobDetails}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

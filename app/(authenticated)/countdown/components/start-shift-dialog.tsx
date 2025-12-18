"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/use-translation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startShiftNow } from "../actions";

interface Job {
  id: string;
  name: string;
}

interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  expected_hours: number;
}

interface StartShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function StartShiftDialog({
  open,
  onOpenChange,
  onSuccess,
}: StartShiftDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  // Load jobs when dialog opens
  useEffect(() => {
    if (open) {
      loadJobs();
    }
  }, [open]);

  // Load templates when job is selected
  useEffect(() => {
    if (selectedJobId) {
      loadTemplates(selectedJobId);
    } else {
      setTemplates([]);
      setSelectedTemplateId("");
    }
  }, [selectedJobId]);

  // Auto-fill times when template is selected
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setStartTime(template.start_time);
        setEndTime(template.end_time);
      }
    }
  }, [selectedTemplateId, templates]);

  const loadJobs = async () => {
    setLoadingData(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("jobs")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setJobs(data || []);

      // Auto-select first job if only one exists
      if (data && data.length === 1) {
        setSelectedJobId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoadingData(false);
    }
  };

  const loadTemplates = async (jobId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shift_templates")
        .select("id, name, start_time, end_time, expected_hours")
        .eq("job_id", jobId)
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job");
      return;
    }

    if (!startTime || !endTime) {
      toast.error("Please provide start and end times");
      return;
    }

    setLoading(true);
    try {
      const result = await startShiftNow({
        jobId: selectedJobId,
        templateId: selectedTemplateId || null,
        startTime,
        endTime,
        notes,
      });

      if (result.error) {
        toast.error("Failed to start shift", { description: result.error });
      } else {
        toast.success("Shift started successfully");
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to start shift");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedJobId("");
    setSelectedTemplateId("");
    setStartTime("");
    setEndTime("");
    setNotes("");
  };

  // Set default times to current time and +8 hours
  useEffect(() => {
    if (open && !selectedTemplateId) {
      const now = new Date();
      const end = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      setStartTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      );
      setEndTime(
        `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
      );
    }
  }, [open, selectedTemplateId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("startShiftNow")}</DialogTitle>
          <DialogDescription>
            Create and start tracking a new shift immediately
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Job Selection */}
            <div className="space-y-2">
              <Label htmlFor="job">{t("job")} *</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger id="job">
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection (Optional) */}
            {selectedJobId && templates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="template">Template (Optional)</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Start from scratch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Start from scratch</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.start_time} -{" "}
                        {template.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">{t("startTime")} *</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">{t("endTime")} *</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")} (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this shift..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || loadingData}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("startShiftNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

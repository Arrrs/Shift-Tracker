"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trash, Archive } from "lucide-react";
import { deleteJob, archiveJob } from "./actions";
import { toast } from "sonner";

interface DeleteJobButtonProps {
  jobId: string;
  jobName: string;
  shiftCount?: number;
  isArchived?: boolean;
  variant?: "link" | "ghost";
  size?: "sm";
  onSuccess?: () => void;
}

export function DeleteJobButton({
  jobId,
  jobName,
  shiftCount = 0,
  isArchived = false,
  variant = "link",
  size,
  onSuccess,
}: DeleteJobButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteOption, setDeleteOption] = useState<"keep" | "delete">("keep");

  const hasShifts = shiftCount > 0;

  const handleArchive = async () => {
    setLoading(true);
    const result = await archiveJob(jobId);
    setLoading(false);

    if (result.error) {
      toast.error("Failed to archive job", {
        description: result.error
      });
    } else {
      setOpen(false);
      toast.success("Job archived successfully", {
        description: "You can restore it from the Archived tab"
      });
      onSuccess?.();
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteJob(jobId, deleteOption === "delete");
    setLoading(false);

    if (result.error) {
      toast.error("Failed to delete job", {
        description: result.error
      });
    } else {
      setOpen(false);
      if (deleteOption === "delete") {
        toast.success("Job deleted permanently", {
          description: "All associated shifts have been removed"
        });
      } else {
        toast.success("Job deleted", {
          description: "Shifts have been preserved in your history"
        });
      }
      onSuccess?.();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className="text-destructive hover:text-destructive" title={isArchived ? "Permanently delete this job" : "Archive or delete this job"}>
          <Trash className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isArchived ? "Permanently Delete Job" : "Archive or Delete Job"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {!isArchived ? (
                // ACTIVE JOB: Suggest archive first
                <>
                  <div className="font-medium">Archive this job instead of deleting?</div>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <Archive className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="text-sm">
                        <div className="font-medium">Recommended: Archive</div>
                        <div className="text-muted-foreground">
                          Keeps all data intact. You can restore this job later.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Or permanently delete "{jobName}" and all shift templates.</div>
                    {hasShifts && (
                      <div className="text-destructive font-medium mt-2">
                        Warning: This job has {shiftCount} logged shift{shiftCount !== 1 ? 's' : ''}.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // ARCHIVED JOB: Permanent delete with options
                <>
                  <div>Permanently delete "{jobName}"?</div>
                  <div className="space-y-2">
                    <div className="font-medium text-destructive text-sm">
                      This will delete:
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                      <li>The job "{jobName}"</li>
                      <li>All shift templates for this job</li>
                    </ul>
                  </div>
                  {hasShifts && (
                    <div className="space-y-3 pt-2">
                      <div className="font-medium text-sm">
                        This job has {shiftCount} logged shift{shiftCount !== 1 ? 's' : ''}.
                        What should happen to them?
                      </div>
                      <RadioGroup value={deleteOption} onValueChange={(value) => setDeleteOption(value as "keep" | "delete")}>
                        <div className="flex items-start space-x-2 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                          <RadioGroupItem value="keep" id="keep" />
                          <Label htmlFor="keep" className="cursor-pointer flex-1">
                            <div className="font-medium text-sm">Keep shifts (Recommended)</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Preserve work history for reports and records. Shifts will no longer be linked to this job.
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2 bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                          <RadioGroupItem value="delete" id="delete" />
                          <Label htmlFor="delete" className="cursor-pointer flex-1">
                            <div className="font-medium text-sm text-destructive">Delete all shifts</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Permanently delete all work history. This cannot be undone.
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  <div className="text-sm text-destructive pt-2">This action cannot be undone.</div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          {!isArchived ? (
            <>
              <Button variant="outline" onClick={handleArchive} disabled={loading}>
                <Archive className="h-4 w-4 mr-2" />
                {loading ? "Archiving..." : "Archive"}
              </Button>
              <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground">
                <Trash className="h-4 w-4 mr-2" />
                {loading ? "Deleting..." : "Delete Permanently"}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground">
              {loading ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

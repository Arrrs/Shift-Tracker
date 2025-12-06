"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";
import { unarchiveJob } from "./actions";
import { toast } from "sonner";

interface UnarchiveJobButtonProps {
  jobId: string;
  variant?: "link" | "ghost" | "outline";
  size?: "sm" | "icon";
  onSuccess?: () => void;
}

export function UnarchiveJobButton({
  jobId,
  variant = "ghost",
  size = "sm",
  onSuccess,
}: UnarchiveJobButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUnarchive = async () => {
    setLoading(true);
    const result = await unarchiveJob(jobId);
    setLoading(false);

    if (result.error) {
      toast.error("Failed to restore job", {
        description: result.error
      });
    } else {
      toast.success("Job restored", {
        description: "Moved to active jobs"
      });
      onSuccess?.();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleUnarchive}
      disabled={loading}
      title="Restore this job (unarchive)"
      className="text-green-600 hover:text-green-600 dark:text-green-500 dark:hover:text-green-500"
    >
      <ArchiveRestore className="h-4 w-4" />
    </Button>
  );
}

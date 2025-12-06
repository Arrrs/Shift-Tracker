"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { archiveJob } from "./actions";
import { toast } from "sonner";

interface ArchiveJobButtonProps {
  jobId: string;
  variant?: "link" | "ghost" | "outline";
  size?: "sm" | "icon";
  onSuccess?: () => void;
}

export function ArchiveJobButton({
  jobId,
  variant = "ghost",
  size = "sm",
  onSuccess,
}: ArchiveJobButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    setLoading(true);
    const result = await archiveJob(jobId);
    setLoading(false);

    if (result.error) {
      toast.error("Failed to archive job", {
        description: result.error
      });
    } else {
      toast.success("Job archived", {
        description: "Moved to archived jobs"
      });
      onSuccess?.();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleArchive}
      disabled={loading}
      title="Archive this job (soft delete)"
      className="text-amber-600 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-500"
    >
      <Archive className="h-4 w-4" />
    </Button>
  );
}

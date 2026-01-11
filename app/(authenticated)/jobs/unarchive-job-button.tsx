"use client";

import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";
import { useUnarchiveJob } from "@/lib/hooks/use-jobs";

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
  const unarchiveMutation = useUnarchiveJob();

  const handleUnarchive = async () => {
    await unarchiveMutation.mutateAsync(jobId);
    onSuccess?.();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleUnarchive}
      disabled={unarchiveMutation.isPending}
      title="Restore this job (unarchive)"
      className="text-green-600 hover:text-green-600 dark:text-green-500 dark:hover:text-green-500"
    >
      <ArchiveRestore className="h-4 w-4" />
    </Button>
  );
}

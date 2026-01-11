"use client";

import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { useArchiveJob } from "@/lib/hooks/use-jobs";

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
  const archiveMutation = useArchiveJob();

  const handleArchive = async () => {
    await archiveMutation.mutateAsync(jobId);
    onSuccess?.();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleArchive}
      disabled={archiveMutation.isPending}
      title="Archive this job (soft delete)"
      className="text-amber-600 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-500"
    >
      <Archive className="h-4 w-4" />
    </Button>
  );
}

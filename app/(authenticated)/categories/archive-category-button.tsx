"use client";

import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { useArchiveCategory } from "@/lib/hooks/use-financial-categories";

interface ArchiveCategoryButtonProps {
  categoryId: string;
  variant?: "link" | "ghost" | "outline";
  size?: "sm" | "icon";
  onSuccess?: () => void;
}

export function ArchiveCategoryButton({
  categoryId,
  variant = "ghost",
  size = "sm",
  onSuccess,
}: ArchiveCategoryButtonProps) {
  const archiveMutation = useArchiveCategory();

  const handleArchive = async () => {
    const result = await archiveMutation.mutateAsync(categoryId);

    if (!result.error) {
      onSuccess?.();
    }
  };

  const loading = archiveMutation.isPending;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleArchive}
      disabled={loading}
      title="Archive this category"
      className="text-amber-600 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-500"
    >
      <Archive className="h-4 w-4" />
    </Button>
  );
}

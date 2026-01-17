"use client";

import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";
import { useUnarchiveCategory } from "@/lib/hooks/use-financial-categories";

interface UnarchiveCategoryButtonProps {
  categoryId: string;
  variant?: "link" | "ghost" | "outline";
  size?: "sm" | "icon";
  onSuccess?: () => void;
}

export function UnarchiveCategoryButton({
  categoryId,
  variant = "ghost",
  size = "sm",
  onSuccess,
}: UnarchiveCategoryButtonProps) {
  const unarchiveMutation = useUnarchiveCategory();

  const handleUnarchive = async () => {
    const result = await unarchiveMutation.mutateAsync(categoryId);

    if (!result.error) {
      onSuccess?.();
    }
  };

  const loading = unarchiveMutation.isPending;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleUnarchive}
      disabled={loading}
      title="Restore this category"
      className="text-emerald-600 hover:text-emerald-600 dark:text-emerald-500 dark:hover:text-emerald-500"
    >
      <ArchiveRestore className="h-4 w-4" />
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";
import { unarchiveCategory } from "./actions";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);

  const handleUnarchive = async () => {
    setLoading(true);
    const result = await unarchiveCategory(categoryId);
    setLoading(false);

    if (result.error) {
      toast.error("Failed to unarchive category", {
        description: result.error
      });
    } else {
      toast.success("Category restored", {
        description: "Moved to active categories"
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
      title="Restore this category"
      className="text-emerald-600 hover:text-emerald-600 dark:text-emerald-500 dark:hover:text-emerald-500"
    >
      <ArchiveRestore className="h-4 w-4" />
    </Button>
  );
}

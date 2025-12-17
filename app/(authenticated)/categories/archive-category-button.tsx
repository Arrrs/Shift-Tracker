"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import { archiveCategory } from "./actions";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    setLoading(true);
    const result = await archiveCategory(categoryId);
    setLoading(false);

    if (result.error) {
      toast.error("Failed to archive category", {
        description: result.error
      });
    } else {
      toast.success("Category archived", {
        description: "Moved to archived categories"
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
      title="Archive this category"
      className="text-amber-600 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-500"
    >
      <Archive className="h-4 w-4" />
    </Button>
  );
}

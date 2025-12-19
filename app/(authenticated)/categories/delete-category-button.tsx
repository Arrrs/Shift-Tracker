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
import { Trash, Archive } from "lucide-react";
import { deleteFinancialCategory, archiveCategory } from "./actions";
import { toast } from "sonner";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
  variant?: "link" | "ghost";
  size?: "sm";
  onSuccess?: () => void;
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
  variant = "link",
  size,
  onSuccess,
}: DeleteCategoryButtonProps) {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      toast.success("Category archived successfully", {
        description: "You can restore it from the Archived tab"
      });
      onSuccess?.();
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteFinancialCategory(categoryId);
    setLoading(false);

    if (result.error) {
      toast.error("Failed to delete category", {
        description: result.error
      });
    } else {
      setOpen(false);
      toast.success("Category deleted", {
        description: "Financial records have been preserved in your history"
      });
      onSuccess?.();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className="text-destructive hover:text-destructive" title="Archive or delete this category">
          <Trash className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Archive or Delete Category
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="font-medium">Archive this category instead of deleting?</div>
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <Archive className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="font-medium">Recommended: Archive</div>
                    <div className="text-muted-foreground">
                      Keeps all data intact. You can restore this category later.
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>Or permanently delete "{categoryName}".</div>
                <div className="mt-2">
                  Note: Financial records using this category will be preserved but marked as "Uncategorized".
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={handleArchive} disabled={loading}>
            <Archive className="h-4 w-4 mr-2" />
            {loading ? "Archiving..." : "Archive"}
          </Button>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground">
            <Trash className="h-4 w-4 mr-2" />
            {loading ? "Deleting..." : "Delete Permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

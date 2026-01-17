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
import { Loader2, Trash, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useDeleteTimeEntry } from "@/lib/hooks/use-time-entries";

interface DeleteTimeEntryButtonProps {
  entryId: string;
  variant?: "link" | "ghost" | "destructive";
  size?: "sm";
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function DeleteTimeEntryButton({
  entryId,
  variant = "destructive",
  size,
  className,
  onSuccess,
  onError,
}: DeleteTimeEntryButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteTimeEntry();

  const handleDelete = async () => {
    const result = await deleteMutation.mutateAsync(entryId);

    if (result.error) {
      onError?.(result.error);
    } else {
      setOpen(false);
      onSuccess?.();
    }
  };

  const loading = deleteMutation.isPending;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={loading}>
          {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("delete")}
                </>
              )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTimeEntry")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteTimeEntryConfirmation")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

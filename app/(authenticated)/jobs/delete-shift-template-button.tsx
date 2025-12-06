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
import { Trash } from "lucide-react";
import { deleteShiftTemplate } from "./actions";

interface DeleteShiftTemplateButtonProps {
  templateId: string;
  templateName: string;
  variant?: "link" | "ghost";
  size?: "sm";
  onSuccess?: () => void;
}

export function DeleteShiftTemplateButton({
  templateId,
  templateName,
  variant = "link",
  size,
  onSuccess,
}: DeleteShiftTemplateButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteShiftTemplate(templateId);
    setLoading(false);

    if (result.error) {
      alert("Error: " + result.error);
    } else {
      setOpen(false);
      onSuccess?.();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Trash className={size === "sm" ? "h-4 w-4" : undefined} />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Shift Template</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{templateName}"? This action
            cannot be undone. Existing shifts using this template will not be
            affected.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

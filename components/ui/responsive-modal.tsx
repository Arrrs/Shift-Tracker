"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog as DialogPrimitive, DialogTrigger as DialogTriggerPrimitive, DialogClose as DialogClosePrimitive } from "@/components/ui/dialog";
import { Drawer as DrawerPrimitive } from "@/components/ui/drawer";

// Create responsive versions of Dialog and Drawer that auto-switch based on screen size
export function Dialog({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return <DialogPrimitive {...props}>{children}</DialogPrimitive>;
  }

  return <DrawerPrimitive {...props}>{children}</DrawerPrimitive>;
}

// Re-export all Dialog components, mapping to Drawer equivalents on mobile
export { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog-drawer-adapter";

// For compatibility
export const DialogTrigger = DialogTriggerPrimitive;
export const DialogClose = DialogClosePrimitive;

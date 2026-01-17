"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  DialogContent as DialogContentPrimitive,
  DialogHeader as DialogHeaderPrimitive,
  DialogTitle as DialogTitlePrimitive,
  DialogDescription as DialogDescriptionPrimitive,
  DialogFooter as DialogFooterPrimitive,
} from "@/components/ui/dialog";
import {
  DrawerContent as DrawerContentPrimitive,
  DrawerHeader as DrawerHeaderPrimitive,
  DrawerTitle as DrawerTitlePrimitive,
  DrawerDescription as DrawerDescriptionPrimitive,
  DrawerFooter as DrawerFooterPrimitive,
} from "@/components/ui/drawer";

export function DialogContent({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogContentPrimitive>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <DialogContentPrimitive className={className} {...props}>
        {children}
      </DialogContentPrimitive>
    );
  }

  return (
    <DrawerContentPrimitive className={className} {...props}>
      {children}
    </DrawerContentPrimitive>
  );
}

export function DialogHeader({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogHeaderPrimitive>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <DialogHeaderPrimitive className={className} {...props}>
        {children}
      </DialogHeaderPrimitive>
    );
  }

  return (
    <DrawerHeaderPrimitive className={`text-left ${className || ""}`} {...props}>
      {children}
    </DrawerHeaderPrimitive>
  );
}

export function DialogTitle({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogTitlePrimitive>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <DialogTitlePrimitive className={className} {...props}>
        {children}
      </DialogTitlePrimitive>
    );
  }

  return (
    <DrawerTitlePrimitive className={className} {...props}>
      {children}
    </DrawerTitlePrimitive>
  );
}

export function DialogDescription({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogDescriptionPrimitive>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <DialogDescriptionPrimitive className={className} {...props}>
        {children}
      </DialogDescriptionPrimitive>
    );
  }

  return (
    <DrawerDescriptionPrimitive className={className} {...props}>
      {children}
    </DrawerDescriptionPrimitive>
  );
}

export function DialogFooter({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogFooterPrimitive>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <DialogFooterPrimitive className={className} {...props}>
        {children}
      </DialogFooterPrimitive>
    );
  }

  return (
    <DrawerFooterPrimitive className={className} {...props}>
      {children}
    </DrawerFooterPrimitive>
  );
}

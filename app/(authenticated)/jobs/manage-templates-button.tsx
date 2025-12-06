"use client";

import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { Database } from "@/lib/database.types";
import { JobDetailsDrawer } from "./job-details-drawer";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

interface ManageTemplatesButtonProps {
  job: Job;
  variant?: "link" | "ghost" | "outline";
  size?: "sm";
}

export function ManageTemplatesButton({
  job,
  variant = "ghost",
  size = "sm",
}: ManageTemplatesButtonProps) {
  return (
    <JobDetailsDrawer
      job={job}
      variant={variant}
      size={size}
    />
  );
}

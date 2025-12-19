"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, Briefcase, Clock, Calendar } from "lucide-react";

export function JobsHelpDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <HelpCircle className="h-4 w-4 md:mr-2" />
          <div className="hidden md:block">Help</div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How Jobs & Shift Templates Work</DialogTitle>
          <DialogDescription>
            A quick guide to help you get started
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto">
          {/* Jobs Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">1. Jobs</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              Jobs represent different positions or roles you work (e.g.,
              "Barista at Cafe A", "Server at Restaurant B"). Each job has its
              own hourly rate and can be marked as active or inactive.
            </p>
          </div>

          {/* Templates Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">2. Shift Templates</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              Templates are reusable shift patterns for each job (e.g., "Morning
              Shift 9-5", "Night Shift 10-6"). Click on a job's eye icon to view
              details and add templates. Templates save time when logging
              shifts.
            </p>
          </div>

          {/* Calendar Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">3. Logging Shifts (Coming Soon)</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              Once you have templates set up, you'll be able to quickly log
              shifts in your calendar by selecting a template instead of
              manually entering times each time.
            </p>
          </div>

          {/* Workflow Example */}
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold text-sm">Example Workflow:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside pl-2">
              <li>Create a job "Barista" with $15/hour rate</li>
              <li>Add templates: "Opening 6-2", "Closing 2-10"</li>
              <li>When you work, quickly log shifts using these templates</li>
              <li>Track your hours and earnings automatically</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
} from "@/components/ui/responsive-modal";
import { HelpCircle, Briefcase, Clock, Calendar } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";

export function JobsHelpDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <HelpCircle className="h-4 w-4 md:mr-2" />
          <div className="hidden md:block">{t("help")}</div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] p-0 flex flex-col max-h-[90vh] overflow-hidden w-full">
        <DialogHeader className="p-4 sm:p-6 pb-0 flex-shrink-0">
          <DialogTitle>{t("howJobsWork")}</DialogTitle>
          <DialogDescription>
            {t("quickGuideToGetStarted")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-4 sm:p-6 pt-4 overflow-y-auto flex-1">
          {/* Jobs Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">1. {t("jobsSection")}</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              {t("jobsSectionDescription")}
            </p>
          </div>

          {/* Templates Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">2. {t("shiftTemplatesSection")}</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              {t("shiftTemplatesSectionDescription")}
            </p>
          </div>

          {/* Calendar Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">3. {t("loggingShiftsSection")}</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              {t("loggingShiftsSectionDescription")}
            </p>
          </div>

          {/* Workflow Example */}
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-semibold text-sm">{t("exampleWorkflow")}</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside pl-2">
              <li>{t("exampleStep1")}</li>
              <li>{t("exampleStep2")}</li>
              <li>{t("exampleStep3")}</li>
              <li>{t("exampleStep4")}</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

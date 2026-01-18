"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  FolderOpen,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Timer,
  PieChart,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const { t } = useTranslation();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="h-7 w-7" />
            {t("helpCenter")}
          </h1>
          <p className="text-muted-foreground">
            {t("helpCenterDescription")}
          </p>
        </div>

        {/* Quick Start Guide */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("quickStartGuide")}
            </CardTitle>
            <CardDescription>
              {t("quickStartDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold">{t("step1Title")}</h4>
                  <p className="text-sm text-muted-foreground">{t("step1Description")}</p>
                  <Link href="/jobs">
                    <Button variant="outline" size="sm" className="mt-2 gap-1">
                      {t("goToJobs")} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold">{t("step2Title")}</h4>
                  <p className="text-sm text-muted-foreground">{t("step2Description")}</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold">{t("step3Title")}</h4>
                  <p className="text-sm text-muted-foreground">{t("step3Description")}</p>
                  <Link href="/calendar">
                    <Button variant="outline" size="sm" className="mt-2 gap-1">
                      {t("goToCalendar")} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold">{t("step4Title")}</h4>
                  <p className="text-sm text-muted-foreground">{t("step4Description")}</p>
                  <Link href="/categories">
                    <Button variant="outline" size="sm" className="mt-2 gap-1">
                      {t("goToCategories")} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Jobs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-blue-500" />
                {t("jobs")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("jobsHelpText")}
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>{t("jobsFeature1")}</li>
                <li>{t("jobsFeature2")}</li>
                <li>{t("jobsFeature3")}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-green-500" />
                {t("calendar")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("calendarHelpText")}
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>{t("calendarFeature1")}</li>
                <li>{t("calendarFeature2")}</li>
                <li>{t("calendarFeature3")}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Countdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Timer className="h-5 w-5 text-orange-500" />
                {t("countdown")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("countdownHelpText")}
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>{t("countdownFeature1")}</li>
                <li>{t("countdownFeature2")}</li>
                <li>{t("countdownFeature3")}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderOpen className="h-5 w-5 text-purple-500" />
                {t("categories")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("categoriesHelpText")}
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>{t("categoriesFeature1")}</li>
                <li>{t("categoriesFeature2")}</li>
                <li>{t("categoriesFeature3")}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Dashboard */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChart className="h-5 w-5 text-cyan-500" />
                {t("dashboard")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("dashboardHelpText")}
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>{t("dashboardFeature1")}</li>
                <li>{t("dashboardFeature2")}</li>
                <li>{t("dashboardFeature3")}</li>
              </ul>
            </CardContent>
          </Card>

          {/* Multi-Currency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                {t("multiCurrency")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("multiCurrencyHelpText")}
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>{t("multiCurrencyFeature1")}</li>
                <li>{t("multiCurrencyFeature2")}</li>
                <li>{t("multiCurrencyFeature3")}</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">{t("proTips")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="text-primary">💡</span>
                <span>{t("tip1")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">💡</span>
                <span>{t("tip2")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">💡</span>
                <span>{t("tip3")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">💡</span>
                <span>{t("tip4")}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Typical Workflow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("typicalWorkflow")}</CardTitle>
            <CardDescription>{t("typicalWorkflowDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                <Briefcase className="h-4 w-4" />
                {t("workflowCreateJob")}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                <Clock className="h-4 w-4" />
                {t("workflowAddTemplates")}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full">
                <Calendar className="h-4 w-4" />
                {t("workflowLogShifts")}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
                <DollarSign className="h-4 w-4" />
                {t("workflowTrackFinances")}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-full">
                <PieChart className="h-4 w-4" />
                {t("workflowViewStats")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

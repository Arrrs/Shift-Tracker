"use client";

import { Suspense, useState, lazy } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJobs } from "@/lib/hooks/use-jobs";
import { usePrefetch, createPrefetchHandlers } from "@/lib/hooks/use-prefetch";
import { Briefcase, Clock, Info, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { getCurrencySymbol } from "@/lib/utils/time-format";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TranslationKey } from "@/lib/i18n/translations";

// Code splitting: Lazy load dialogs and drawers
const AddJobDialog = lazy(() => import("./add-job-dialog").then((mod) => ({ default: mod.AddJobDialog })));
const EditJobDialog = lazy(() => import("./edit-job-dialog").then((mod) => ({ default: mod.EditJobDialog })));
const JobDetailsDrawer = lazy(() => import("./job-details-drawer").then((mod) => ({ default: mod.JobDetailsDrawer })));
const JobsHelpDialog = lazy(() => import("./jobs-help-dialog").then((mod) => ({ default: mod.JobsHelpDialog })));
const DeleteJobButton = lazy(() => import("./delete-job-button").then((mod) => ({ default: mod.DeleteJobButton })));
const ArchiveJobButton = lazy(() => import("./archive-job-button").then((mod) => ({ default: mod.ArchiveJobButton })));
const UnarchiveJobButton = lazy(() => import("./unarchive-job-button").then((mod) => ({ default: mod.UnarchiveJobButton })));

// Helper function to format currency values (removes trailing zeros)
function formatCurrencyValue(value: number | null | undefined): string {
  if (!value) return '0';
  // Remove trailing zeros and unnecessary decimal point
  return value.toFixed(2).replace(/\.?0+$/, '');
}

// Helper function to format job rate display
function formatJobRate(job: any, t: (key: TranslationKey) => string): string {
  const symbol = getCurrencySymbol(job.currency || 'USD');

  switch (job.pay_type) {
    case 'daily':
      return `${symbol} ${formatCurrencyValue(job.daily_rate)}${t("perDay")}`;
    case 'monthly':
      return `${symbol} ${formatCurrencyValue(job.monthly_salary)}${t("perMonth")}`;
    case 'salary':
      return `${symbol} ${Math.round(job.monthly_salary || 0)}${t("perYear")}`;
    case 'hourly':
    default:
      return `${symbol} ${formatCurrencyValue(job.hourly_rate)}${t("perHour")}`;
  }
}

function JobsList() {
  const { t } = useTranslation();
  const { data: jobs = [], error, isLoading: loading } = useJobs();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter jobs based on search query
  const filteredJobs = jobs.filter((job) =>
    job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return <div>{t("errorLoadingJobs")}: {error.message}</div>;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Desktop skeleton */}
        <div className="hidden md:block border rounded-lg p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b last:border-0">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <div className="ml-auto flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
        {/* Mobile skeleton */}
        <div className="block md:hidden space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2 pt-2 border-t">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeJobs = filteredJobs.filter(job => job.is_active);
  const archivedJobs = filteredJobs.filter(job => !job.is_active);

  const renderJobsTable = (jobsList: any[], showArchived: boolean) => {
    if (!jobsList || jobsList.length === 0) {
      return (
        <div className="text-center py-12 space-y-4">
          <div className="flex justify-center">
            <Briefcase className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {showArchived ? t("noArchivedJobs") : t("noActiveJobs")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {showArchived
                ? t("jobsArchivedWillAppearHere")
                : t("jobsRepresentPositions")
              }
            </p>
          </div>
          {!showArchived && (
            <>
              <div className="space-y-3 max-w-md mx-auto text-left bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  {t("gettingStarted")}
                </h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>{t("createAJob")}</li>
                  <li>{t("addShiftTemplates")}</li>
                  <li>{t("useTemplatesQuickly")}</li>
                </ol>
              </div>
              <div>
                <AddJobDialog />
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <>
        {/* Desktop table view */}
        <div className="hidden md:block border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4">{t("name")}</th>
                <th className="text-left p-4">{t("rate")}</th>
                <th className="text-left p-4">{t("templates")}</th>
                <th className="text-left p-4">{t("status")}</th>
                <th className="text-right p-4">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {jobsList.map((job) => (
                <JobDetailsDrawer key={job.id} job={job} variant="ghost" size="sm">
                  <tr className="border-b last:border-0 hover:bg-muted/50 cursor-pointer">
                    <td className="p-4">{job.name}</td>
                    <td className="p-4">
                      {formatJobRate(job, t)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {job.template_count || 0}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={job.is_active ? "default" : "secondary"}>
                        {job.is_active ? t("active") : t("archived")}
                      </Badge>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <EditJobDialog
                          job={job}
                          variant="link"
                          size="sm"
                        />
                        {job.is_active ? (
                          <ArchiveJobButton
                            jobId={job.id}
                            variant="link"
                            size="sm"
                          />
                        ) : (
                          <UnarchiveJobButton
                            jobId={job.id}
                            variant="link"
                            size="sm"
                          />
                        )}
                        <DeleteJobButton
                          jobId={job.id}
                          jobName={job.name}
                          shiftCount={job.entry_count}
                          isArchived={!job.is_active}
                          variant="link"
                          size="sm"
                        />
                      </div>
                    </td>
                  </tr>
                </JobDetailsDrawer>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="block md:hidden space-y-4">
          {jobsList.map((job) => (
            <JobDetailsDrawer key={job.id} job={job} variant="ghost" size="sm">
              <div className="border rounded-lg p-4 pb-2 space-y-3 cursor-pointer hover:bg-muted/50">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{job.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatJobRate(job, t)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{job.template_count || 0} {job.template_count === 1 ? t("template") : t("templatesCount")}</span>
                    </div>
                  </div>
                  <Badge variant={job.is_active ? "default" : "secondary"}>
                    {job.is_active ? t("active") : t("archived")}
                  </Badge>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <EditJobDialog
                    job={job}
                    variant="ghost"
                    size="sm"
                  />
                  {job.is_active ? (
                    <ArchiveJobButton
                      jobId={job.id}
                      variant="ghost"
                      size="sm"
                    />
                  ) : (
                    <UnarchiveJobButton
                      jobId={job.id}
                      variant="ghost"
                      size="sm"
                    />
                  )}
                  <DeleteJobButton
                    jobId={job.id}
                    jobName={job.name}
                    shiftCount={job.entry_count}
                    isArchived={!job.is_active}
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </div>
            </JobDetailsDrawer>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchJobsByName")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">{t("active")} ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="archived">{t("archived")} ({archivedJobs.length})</TabsTrigger>
          <TabsTrigger value="all">{t("all")} ({filteredJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {renderJobsTable(activeJobs, false)}
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          {renderJobsTable(archivedJobs, true)}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {renderJobsTable(filteredJobs, false)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function JobsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen p-8">
      {/* Header with title and buttons */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t("jobs")}</h1>
        <div className="flex gap-2">
          <Suspense fallback={null}>
            <JobsHelpDialog />
          </Suspense>
          <Suspense fallback={null}>
            <AddJobDialog />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-12">{t("loading")}...</div>}>
        <JobsList />
      </Suspense>
    </div>
  );
}

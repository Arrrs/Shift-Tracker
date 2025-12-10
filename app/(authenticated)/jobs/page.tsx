"use client";

import { Suspense, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddJobDialog } from "./add-job-dialog";
import { DeleteJobButton } from "./delete-job-button";
import { EditJobDialog } from "./edit-job-dialog";
import { JobDetailsDrawer } from "./job-details-drawer";
import { JobsHelpDialog } from "./jobs-help-dialog";
import { ArchiveJobButton } from "./archive-job-button";
import { UnarchiveJobButton } from "./unarchive-job-button";
import { getJobs } from "./actions";
import { Briefcase, Clock, Info, Search } from "lucide-react";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { getCurrencySymbol } from "@/lib/utils/time-format";

// Helper function to format job rate display
function formatJobRate(job: any): string {
  const symbol = getCurrencySymbol(job.currency || 'USD');

  switch (job.pay_type) {
    case 'daily':
      return `${symbol} ${job.daily_rate?.toFixed(2) || '0.00'}/day`;
    case 'monthly':
      return `${symbol} ${job.monthly_rate?.toFixed(2) || '0.00'}/mo`;
    case 'salary':
      return `${symbol} ${job.annual_salary?.toFixed(0) || '0'}/yr`;
    case 'hourly':
    default:
      return `${symbol} ${job.hourly_rate?.toFixed(2) || '0.00'}/hr`;
  }
}

function JobsList() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadJobs = async () => {
    setLoading(true);
    const result = await getJobs();
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.jobs) {
      setJobs(result.jobs);
    }
  };

  const handleJobUpdate = () => {
    loadJobs();
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // Filter jobs based on search query
  const filteredJobs = jobs.filter((job) =>
    job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return <div>Error loading jobs: {error}</div>;
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
              {showArchived ? "No archived jobs" : "No active jobs"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {showArchived
                ? "Jobs that you archive will appear here."
                : "Jobs represent different positions or roles you work. Each job can have its own hourly rate and shift templates."
              }
            </p>
          </div>
          {!showArchived && (
            <>
              <div className="space-y-3 max-w-md mx-auto text-left bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Getting Started
                </h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Create a job (e.g., "Barista", "Server", "Retail")</li>
                  <li>Add shift templates to your job (e.g., "Morning Shift 9-5")</li>
                  <li>Use templates to quickly log shifts in your calendar</li>
                </ol>
              </div>
              <div>
                <AddJobDialog onSuccess={handleJobUpdate} />
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
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Rate</th>
                <th className="text-left p-4">Templates</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobsList.map((job) => (
                <JobDetailsDrawer key={job.id} job={job} variant="ghost" size="sm" onTemplateChange={handleJobUpdate}>
                  <tr className="border-b last:border-0 hover:bg-muted/50 cursor-pointer">
                    <td className="p-4">{job.name}</td>
                    <td className="p-4">
                      {formatJobRate(job)}
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
                        {job.is_active ? "Active" : "Archived"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <EditJobDialog
                          job={job}
                          variant="link"
                          size="sm"
                          onSuccess={handleJobUpdate}
                        />
                        {job.is_active ? (
                          <ArchiveJobButton
                            jobId={job.id}
                            variant="link"
                            size="sm"
                            onSuccess={handleJobUpdate}
                          />
                        ) : (
                          <UnarchiveJobButton
                            jobId={job.id}
                            variant="link"
                            size="sm"
                            onSuccess={handleJobUpdate}
                          />
                        )}
                        <DeleteJobButton
                          jobId={job.id}
                          jobName={job.name}
                          shiftCount={job.shift_count}
                          isArchived={!job.is_active}
                          variant="link"
                          size="sm"
                          onSuccess={handleJobUpdate}
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
            <JobDetailsDrawer key={job.id} job={job} variant="ghost" size="sm" onTemplateChange={handleJobUpdate}>
              <div className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{job.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatJobRate(job)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{job.template_count || 0} template{job.template_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <Badge variant={job.is_active ? "default" : "secondary"}>
                    {job.is_active ? "Active" : "Archived"}
                  </Badge>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <EditJobDialog
                    job={job}
                    variant="ghost"
                    size="sm"
                    onSuccess={handleJobUpdate}
                  />
                  {job.is_active ? (
                    <ArchiveJobButton
                      jobId={job.id}
                      variant="ghost"
                      size="sm"
                      onSuccess={handleJobUpdate}
                    />
                  ) : (
                    <UnarchiveJobButton
                      jobId={job.id}
                      variant="ghost"
                      size="sm"
                      onSuccess={handleJobUpdate}
                    />
                  )}
                  <DeleteJobButton
                    jobId={job.id}
                    jobName={job.name}
                    shiftCount={job.shift_count}
                    isArchived={!job.is_active}
                    variant="ghost"
                    size="sm"
                    onSuccess={handleJobUpdate}
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
          placeholder="Search jobs by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archivedJobs.length})</TabsTrigger>
          <TabsTrigger value="all">All ({filteredJobs.length})</TabsTrigger>
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleJobUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header with title and buttons */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <div className="flex gap-2">
          <JobsHelpDialog />
          <AddJobDialog onSuccess={handleJobUpdate} />
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading jobs...</div>}>
        <JobsList key={refreshTrigger} />
      </Suspense>
    </div>
  );
}

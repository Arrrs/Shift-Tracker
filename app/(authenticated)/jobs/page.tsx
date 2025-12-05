import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { AddJobDialog } from "./add-job-dialog";
import { DeleteJobButton } from "./delete-job-button";
import { EditJobDialog } from "./edit-job-dialog";
import { JobDetailsDrawer } from "./job-details-drawer";
import { getJobs } from "./actions";

async function JobsList() {
  // Fetch jobs (authentication handled in action)
  const { jobs, error } = await getJobs();

  if (error) {
    return <div>Error loading jobs: {error}</div>;
  }

  return (
    <>
      {/* Empty state or table */}
      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No jobs yet. Add your first job to get started!</p>
        </div>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden md:block border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Rate</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    {/* Job cells */}
                    <td className="p-4">{job.name}</td>
                    <td className="p-4">
                      ${job.hourly_rate.toFixed(2)} {job.currency}
                    </td>
                    <td className="p-4">
                      <Badge variant={job.is_active ? "default" : "secondary"}>
                        {job.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <JobDetailsDrawer
                          job={job}
                          variant="link"
                          size="sm"
                        />
                        <EditJobDialog
                          job={job}
                          variant="link"
                          size="sm"
                        />
                        <DeleteJobButton
                          jobId={job.id}
                          jobName={job.name}
                          variant="link"
                          size="sm"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="block md:hidden space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{job.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${job.hourly_rate.toFixed(2)} {job.currency}
                    </p>
                  </div>
                  <Badge variant={job.is_active ? "default" : "secondary"}>
                    {job.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <JobDetailsDrawer
                    job={job}
                    variant="ghost"
                    size="sm"
                  />
                  <EditJobDialog
                    job={job}
                    variant="ghost"
                    size="sm"
                  />
                  <DeleteJobButton
                    jobId={job.id}
                    jobName={job.name}
                    variant="ghost"
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function JobsPage() {
  return (
    <div className="min-h-screen p-8">
      {/* Header with title and Add button */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <AddJobDialog />
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading jobs...</div>}>
        <JobsList />
      </Suspense>
    </div>
  );
}

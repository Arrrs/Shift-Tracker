"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, Info } from "lucide-react";
import { Database } from "@/lib/database.types";
import { useShiftTemplates } from "@/lib/hooks/use-shift-templates";
import { AddShiftTemplateDialog } from "./add-shift-template-dialog";
import { EditShiftTemplateDialog } from "./edit-shift-template-dialog";
import { DeleteShiftTemplateButton } from "./delete-shift-template-button";
import { Skeleton } from "@/components/ui/skeleton";

type ShiftTemplate = Database["public"]["Tables"]["shift_templates"]["Row"];

interface ShiftTemplatesListProps {
  jobId: string;
  onTemplateChange?: () => void;
}

export function ShiftTemplatesList({ jobId, onTemplateChange }: ShiftTemplatesListProps) {
  const { data: templates = [], isLoading: loading, error } = useShiftTemplates(jobId);

  if (error) {
    return <div className="text-sm text-destructive">Error loading templates: {error.message}</div>;
  }

  return (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Shift Templates</h3>
        <AddShiftTemplateDialog jobId={jobId} onSuccess={onTemplateChange} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="w-4 h-4 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium">What are shift templates?</p>
              <p className="text-sm text-muted-foreground">
                Templates are reusable shift patterns (e.g., "Morning 9-5", "Night 10-6").
                Click "Add Template" above to quickly log shifts without entering times repeatedly.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: template.color || "#3B82F6" }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{template.name}</p>
                    {template.short_code && (
                      <Badge variant="outline" className="text-xs">
                        {template.short_code}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {template.start_time} - {template.end_time}
                    </span>
                    <span className="ml-2">
                      ({template.expected_hours}h)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <EditShiftTemplateDialog
                  template={template}
                  variant="ghost"
                  size="sm"
                  onSuccess={onTemplateChange}
                />
                <DeleteShiftTemplateButton
                  templateId={template.id}
                  templateName={template.name}
                  variant="ghost"
                  size="sm"
                  onSuccess={onTemplateChange}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

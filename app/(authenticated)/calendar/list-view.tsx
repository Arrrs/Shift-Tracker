"use client";

import { useState } from "react";
import { Database } from "@/lib/database.types";
import { EditTimeEntryDialog } from "./edit-time-entry-dialog";
import { EditFinancialRecordDialog } from "./edit-financial-record-dialog";
import { getStatusInfo, formatHours, getCurrencySymbol, formatCurrency } from "@/lib/utils/time-format";
import { TrendingUp, TrendingDown, Briefcase, CalendarOff, Moon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
  shift_templates: Database["public"]["Tables"]["shift_templates"]["Row"] | null;
};

type FinancialRecord = Database["public"]["Tables"]["financial_records"]["Row"] & {
  financial_categories?: Database["public"]["Tables"]["financial_categories"]["Row"] | null;
  jobs?: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

interface ListViewProps {
  entries: TimeEntry[];
  financialRecords?: FinancialRecord[];
  loading: boolean;
  onEntryChange?: () => void;
}

// Helper to get item type icon
function getItemIcon(item: { type: 'entry' | 'financial'; data: TimeEntry | FinancialRecord }, size: 'sm' | 'md' = 'sm') {
  const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  if (item.type === 'entry') {
    const entry = item.data as TimeEntry;
    if (entry.entry_type === 'day_off') {
      return <CalendarOff className={`${sizeClass} text-purple-500`} />;
    }
    return <Briefcase className={`${sizeClass} text-blue-500`} />;
  } else {
    const record = item.data as FinancialRecord;
    if (record.type === 'income') {
      return <TrendingUp className={`${sizeClass} text-green-600 dark:text-green-400`} />;
    }
    return <TrendingDown className={`${sizeClass} text-red-600 dark:text-red-400`} />;
  }
}

// Helper to get item name/title
function getItemName(item: { type: 'entry' | 'financial'; data: TimeEntry | FinancialRecord }) {
  if (item.type === 'entry') {
    const entry = item.data as TimeEntry;
    if (entry.entry_type === 'day_off') {
      return entry.day_off_type?.toUpperCase() || 'Day Off';
    }
    return entry.jobs?.name || 'Freelance';
  } else {
    const record = item.data as FinancialRecord;
    return record.description || (record.type === 'income' ? 'Income' : 'Expense');
  }
}

export function ListView({ entries, financialRecords = [], loading, onEntryChange }: ListViewProps) {
  const { formatDate } = useTranslation();
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState<FinancialRecord | null>(null);
  const [editFinancialDialogOpen, setEditFinancialDialogOpen] = useState(false);

  const handleEntryClick = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setEditDialogOpen(true);
  };

  const handleFinancialClick = (record: FinancialRecord) => {
    setSelectedFinancialRecord(record);
    setEditFinancialDialogOpen(true);
  };

  const handleEditSuccess = () => {
    onEntryChange?.();
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-12 bg-muted/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0 && financialRecords.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No entries found for this month</p>
      </div>
    );
  }

  // Combine entries and financial records into a unified list
  type ListItem =
    | { type: 'entry'; data: TimeEntry }
    | { type: 'financial'; data: FinancialRecord };

  const allItems: ListItem[] = [
    ...entries.map((entry): ListItem => ({ type: 'entry', data: entry })),
    ...financialRecords.map((record): ListItem => ({ type: 'financial', data: record }))
  ];

  // Sort all items by date (newest first)
  const sortedItems = allItems.sort((a, b) => {
    const aDate = new Date(a.data.date).getTime();
    const bDate = new Date(b.data.date).getTime();
    if (aDate !== bDate) return bDate - aDate; // Descending (newest first)

    // If same date, sort by type then time
    if (a.type === 'entry' && b.type === 'entry') {
      const aTime = (a.data as TimeEntry).start_time || "00:00";
      const bTime = (b.data as TimeEntry).start_time || "00:00";
      return bTime.localeCompare(aTime); // Later times first
    }
    if (a.type === 'entry' && b.type === 'financial') return -1;
    if (a.type === 'financial' && b.type === 'entry') return 1;
    return 0;
  });

  return (
    <>
      <div className="space-y-2">
        {sortedItems.map((item) => {
          if (item.type === 'entry') {
            const entry = item.data;
            const status = getStatusInfo(entry.status || "planned");
            const entryDate = new Date(entry.date);
            const formattedDateShort = formatDate(entryDate, {
              month: "short",
              day: true,
            });
            const formattedDateFull = formatDate(entryDate, {
              weekday: "short",
              month: "short",
              day: true,
            });

            const isWorkShift = entry.entry_type === "work_shift";
            const isDayOff = entry.entry_type === "day_off";
            const jobColor = entry.jobs?.color || "#6B7280";
            const templateCode = entry.shift_templates?.short_code || entry.shift_templates?.name;

            // Calculate earnings for work shifts
            let amount = 0;
            const currency = entry.custom_currency || entry.jobs?.currency || 'USD';
            if (isWorkShift) {
              const hours = entry.actual_hours || entry.scheduled_hours || 0;
              if (entry.pay_override_type === 'fixed_amount' && entry.holiday_fixed_amount) {
                amount = entry.holiday_fixed_amount;
              } else if (entry.custom_hourly_rate && hours > 0) {
                amount = hours * entry.custom_hourly_rate * (entry.holiday_multiplier || 1);
              } else if (entry.custom_daily_rate) {
                amount = entry.custom_daily_rate * (entry.holiday_multiplier || 1);
              } else if (entry.jobs && (entry.jobs.pay_type === 'hourly' || entry.jobs.pay_type === 'daily')) {
                const multiplier = entry.holiday_multiplier || 1;
                if (entry.jobs.pay_type === 'hourly' && entry.jobs.hourly_rate && hours > 0) {
                  amount = hours * entry.jobs.hourly_rate * multiplier;
                } else if (entry.jobs.pay_type === 'daily' && entry.jobs.daily_rate) {
                  amount = entry.jobs.daily_rate * multiplier;
                }
              }
            }

            return (
              <div
                key={`entry-${entry.id}`}
                onClick={() => handleEntryClick(entry)}
                className={`border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer ${status.borderColor}`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Icon + Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Type Icon */}
                    {getItemIcon(item, 'md')}

                    {/* Job color dot */}
                    {isWorkShift && entry.jobs && (
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: jobColor }}
                      />
                    )}

                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {getItemName(item)}
                        </span>
                        {templateCode && (
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                            {templateCode}
                          </span>
                        )}
                        {entry.is_overnight && (
                          <Moon className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                        )}
                        <span className="text-sm flex-shrink-0">{status.emoji}</span>
                      </div>

                      {/* Secondary info - visible on desktop */}
                      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {isWorkShift && entry.start_time && entry.end_time && (
                          <span>{entry.start_time} - {entry.end_time}</span>
                        )}
                        {isDayOff && (
                          <span>{entry.is_full_day ? "Full Day" : `${entry.actual_hours}h`}</span>
                        )}
                        {isWorkShift && (entry.actual_hours || 0) > 0 && (
                          <span>• {formatHours(entry.actual_hours || 0)}</span>
                        )}
                        {entry.notes && (
                          <span className="truncate max-w-[200px]">• {entry.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Date + Amount */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      <span className="md:hidden">{formattedDateShort}</span>
                      <span className="hidden md:inline">{formattedDateFull}</span>
                    </span>
                    {amount > 0 && (
                      <span className={`font-semibold ${
                        entry.status === 'completed' ? status.color : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {getCurrencySymbol(currency)}{formatCurrency(amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          } else {
            // Financial record
            const record = item.data;
            const isIncome = record.type === 'income';
            const category = record.financial_categories;
            const recordDate = new Date(record.date);
            const formattedDateShort = formatDate(recordDate, {
              month: "short",
              day: true,
            });
            const formattedDateFull = formatDate(recordDate, {
              weekday: "short",
              month: "short",
              day: true,
            });

            // Status styling
            const recordStatus = record.status || 'completed';
            const isCancelled = recordStatus === 'cancelled';
            const isPlanned = recordStatus === 'planned';

            // Get border color based on status and type
            let borderColor: string;
            if (isCancelled) {
              borderColor = 'border-gray-300 dark:border-gray-700';
            } else if (isPlanned) {
              borderColor = 'border-amber-200 dark:border-amber-900';
            } else {
              borderColor = isIncome
                ? 'border-green-200 dark:border-green-900'
                : 'border-red-200 dark:border-red-900';
            }

            // Get text color for amount
            let amountColor: string;
            if (isCancelled) {
              amountColor = 'text-gray-400 dark:text-gray-600';
            } else if (isPlanned) {
              amountColor = 'text-amber-600 dark:text-amber-400';
            } else {
              amountColor = isIncome
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400';
            }

            return (
              <div
                key={`financial-${record.id}`}
                onClick={() => handleFinancialClick(record)}
                className={`border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer ${borderColor}`}
                style={{ opacity: isCancelled ? 0.5 : 1 }}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Icon + Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Type Icon */}
                    {getItemIcon(item, 'md')}

                    {/* Category icon */}
                    {category?.icon && (
                      <span className="text-base flex-shrink-0">{category.icon}</span>
                    )}

                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{getItemName(item)}</span>
                        {isPlanned && <span className="text-xs flex-shrink-0">📅</span>}
                        {isCancelled && <span className="text-xs flex-shrink-0">❌</span>}
                      </div>

                      {/* Secondary info - visible on desktop */}
                      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {category && <span>{category.name}</span>}
                        {record.jobs && (
                          <span className="flex items-center gap-1">
                            • <span className="w-2 h-2 rounded inline-block" style={{ backgroundColor: record.jobs.color || "#3B82F6" }} />
                            {record.jobs.name}
                          </span>
                        )}
                        {record.notes && (
                          <span className="truncate max-w-[200px]">• {record.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Date + Amount */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      <span className="md:hidden">{formattedDateShort}</span>
                      <span className="hidden md:inline">{formattedDateFull}</span>
                    </span>
                    <span className={`font-semibold ${amountColor}`}>
                      {isIncome ? '+' : '-'}{getCurrencySymbol(record.currency)}{formatCurrency(Number(record.amount))}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>

      <EditTimeEntryDialog
        entry={selectedEntry}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      <EditFinancialRecordDialog
        record={selectedFinancialRecord}
        open={editFinancialDialogOpen}
        onOpenChange={setEditFinancialDialogOpen}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}

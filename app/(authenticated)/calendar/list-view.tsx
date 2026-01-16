"use client";

import { useState } from "react";
import { Database } from "@/lib/database.types";
import { EditTimeEntryDialog } from "./edit-time-entry-dialog";
import { EditFinancialRecordDialog } from "./edit-financial-record-dialog";
import { getStatusInfo, formatHours, getCurrencySymbol, formatCurrency } from "@/lib/utils/time-format";
import { TrendingUp, TrendingDown, Briefcase, CalendarOff } from "lucide-react";

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
function getItemIcon(item: { type: 'entry' | 'financial'; data: TimeEntry | FinancialRecord }) {
  if (item.type === 'entry') {
    const entry = item.data as TimeEntry;
    if (entry.entry_type === 'day_off') {
      return <CalendarOff className="h-4 w-4 text-purple-500" />;
    }
    return <Briefcase className="h-4 w-4 text-blue-500" />;
  } else {
    const record = item.data as FinancialRecord;
    if (record.type === 'income') {
      return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
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
            className="h-16 md:h-20 bg-muted/50 rounded-lg animate-pulse"
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
            const formattedDateShort = entryDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const formattedDateFull = entryDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
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
                className={`border rounded-lg p-3 md:p-4 hover:bg-muted/50 transition-colors cursor-pointer ${status.borderColor}`}
              >
                {/* Mobile View - Simplified */}
                <div className="flex md:hidden items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Icon */}
                    {getItemIcon(item)}
                    {/* Job color dot */}
                    {isWorkShift && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: jobColor }}
                      />
                    )}
                    {/* Name with template code */}
                    <span className="font-medium truncate">
                      {getItemName(item)}
                      {templateCode && (
                        <span className="text-xs text-muted-foreground ml-1">
                          [{templateCode}]
                        </span>
                      )}
                    </span>
                    {/* Status emoji */}
                    <span className="text-sm flex-shrink-0">{status.emoji}</span>
                  </div>
                  {/* Right side: Date and amount */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {amount > 0 && (
                      <span className={`font-semibold text-sm ${
                        entry.status === 'completed' ? status.color : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {getCurrencySymbol(currency)}{formatCurrency(amount)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{formattedDateShort}</span>
                  </div>
                </div>

                {/* Desktop View - Full details */}
                <div className="hidden md:flex flex-row items-center justify-between gap-3">
                  {/* Left side: Date and Job */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                      <h3 className="font-semibold text-base">
                        {formattedDateFull}
                      </h3>
                      {isWorkShift && entry.start_time && entry.end_time && (
                        <span className="text-sm text-muted-foreground">
                          {entry.start_time} - {entry.end_time}
                        </span>
                      )}
                      {isDayOff && (
                        <span className="text-sm text-muted-foreground">
                          {entry.day_off_type?.toUpperCase()} - {entry.is_full_day ? "Full Day" : `${entry.actual_hours}h`}
                        </span>
                      )}
                      <span className="text-sm">{status.emoji}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.jobs ? (
                        <>
                          <div
                            className="w-2 h-2 rounded flex-shrink-0"
                            style={{ backgroundColor: jobColor }}
                          />
                          <p className="text-sm text-muted-foreground">
                            {entry.jobs.name}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded bg-gray-400 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {isDayOff ? "Day Off" : "Freelance"}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Badges row - overnight and template */}
                    {(entry.is_overnight || entry.shift_templates) && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.is_overnight && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                            🌙 overnight
                          </span>
                        )}
                        {entry.shift_templates && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            📋 {templateCode}
                          </span>
                        )}
                      </div>
                    )}

                    {entry.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  {/* Right side: Stats */}
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Hours</p>
                      <p className="font-semibold">
                        {formatHours(entry.actual_hours || 0)}
                      </p>
                    </div>
                    {amount > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {entry.status === 'completed' ? 'Earned' : 'Expected'}
                        </p>
                        <p className={`font-semibold ${
                          entry.status === 'completed' ? status.color : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {getCurrencySymbol(currency)}{formatCurrency(amount)}
                        </p>
                      </div>
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
            const formattedDateShort = recordDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const formattedDateFull = recordDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            // Status styling using centralized approach
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
                className={`border rounded-lg p-3 md:p-4 hover:bg-muted/50 transition-colors cursor-pointer ${borderColor}`}
                style={{ opacity: isCancelled ? 0.5 : 1 }}
              >
                {/* Mobile View - Simplified */}
                <div className="flex md:hidden items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Icon */}
                    {getItemIcon(item)}
                    {/* Category icon if available */}
                    {category?.icon && (
                      <span className="text-sm flex-shrink-0">{category.icon}</span>
                    )}
                    {/* Description */}
                    <span className="font-medium truncate">{getItemName(item)}</span>
                    {/* Status indicator */}
                    {isPlanned && <span className="text-xs flex-shrink-0">📅</span>}
                    {isCancelled && <span className="text-xs flex-shrink-0">❌</span>}
                  </div>
                  {/* Right side: Amount and date */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`font-semibold text-sm ${amountColor}`}>
                      {isIncome ? '+' : '-'}{getCurrencySymbol(record.currency)}{formatCurrency(Number(record.amount))}
                    </span>
                    <span className="text-xs text-muted-foreground">{formattedDateShort}</span>
                  </div>
                </div>

                {/* Desktop View - Full details */}
                <div className="hidden md:flex flex-row items-center justify-between gap-3">
                  {/* Left side: Date and Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base">
                        {formattedDateFull}
                      </h3>
                      {isIncome ? (
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium">
                        {isIncome ? 'Income' : 'Expense'}
                      </span>
                      {isPlanned && <span className="text-xs">📅</span>}
                      {isCancelled && <span className="text-xs">❌</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {record.description}
                      </p>
                    </div>
                    {category && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    )}
                    {record.jobs && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <div className="w-2 h-2 rounded" style={{ backgroundColor: record.jobs.color || "#3B82F6" }} />
                        <span>{record.jobs.name}</span>
                      </div>
                    )}
                    {record.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {record.notes}
                      </p>
                    )}
                  </div>

                  {/* Right side: Amount */}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {isPlanned ? 'Expected' : isCancelled ? 'Cancelled' : 'Amount'}
                    </p>
                    <p className={`text-lg font-bold ${amountColor}`}>
                      {isIncome ? '+' : '-'}{getCurrencySymbol(record.currency)}{formatCurrency(Number(record.amount))}
                    </p>
                    <p className={`text-[10px] ${amountColor}`}>
                      {record.currency}
                    </p>
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

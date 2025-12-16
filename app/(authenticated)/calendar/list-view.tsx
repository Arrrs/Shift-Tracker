"use client";

import { useState } from "react";
import { Database } from "@/lib/database.types";
import { EditTimeEntryDialog } from "./edit-time-entry-dialog";
import { EditFinancialRecordDialog } from "./edit-financial-record-dialog";
import { formatTimeFromTimestamp, getStatusInfo, formatHours, getCurrencySymbol, formatCurrency } from "@/lib/utils/time-format";
import { TrendingUp, TrendingDown } from "lucide-react";

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
            className="h-20 bg-muted/50 rounded-lg animate-pulse"
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

  // Sort all items by date
  const sortedItems = allItems.sort((a, b) => {
    const aDate = new Date(a.data.date).getTime();
    const bDate = new Date(b.data.date).getTime();
    if (aDate !== bDate) return aDate - bDate;

    // If same date, put shifts before financial records, then sort by time
    if (a.type === 'entry' && b.type === 'entry') {
      const aTime = a.data.start_time || "00:00";
      const bTime = b.data.start_time || "00:00";
      return aTime.localeCompare(bTime);
    }
    if (a.type === 'entry' && b.type === 'financial') return -1;
    if (a.type === 'financial' && b.type === 'entry') return 1;
    return 0;
  });

  return (
    <>
      <div className="space-y-2">
        {sortedItems.map((item, index) => {
          if (item.type === 'entry') {
            const entry = item.data;
            const status = getStatusInfo(entry.status || "planned");
            const entryDate = new Date(entry.date);
            const formattedDate = entryDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const isWorkShift = entry.entry_type === "work_shift";
            const isDayOff = entry.entry_type === "day_off";

            return (
              <div
                key={`entry-${entry.id}`}
                onClick={() => handleEntryClick(entry)}
                className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${status.borderColor}`}
              >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Left side: Date and Job */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base">
                    {formattedDate}
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
                  {entry.is_overnight && (
                    <span className="text-[10px] text-orange-500">overnight</span>
                  )}
                  {entry.shift_templates && (
                    <span className="text-blue-500 text-[10px]">
                      📋 {entry.shift_templates.short_code || entry.shift_templates.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {entry.jobs ? (
                    <>
                      <div
                        className="w-2 h-2 rounded"
                        style={{ backgroundColor: entry.jobs.color || "#3B82F6" }}
                      />
                      <p className="text-sm text-muted-foreground">
                        {entry.jobs.name}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded bg-gray-400" />
                      <p className="text-sm text-muted-foreground">
                        {isDayOff ? "Day Off" : "Personal Time"}
                      </p>
                    </>
                  )}
                </div>
                {entry.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
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
                {isWorkShift && (() => {
                  const currency = entry.custom_currency || entry.jobs?.currency || 'USD';
                  const hours = entry.actual_hours || entry.scheduled_hours || 0;
                  let amount = 0;

                  // Calculate amount using same logic as day-shifts-drawer
                  // Priority 1: Fixed amount
                  if (entry.pay_override_type === 'fixed_amount' && entry.holiday_fixed_amount) {
                    amount = entry.holiday_fixed_amount;
                  }
                  // Priority 2: Custom rates with optional multiplier
                  else if (entry.custom_hourly_rate && hours > 0) {
                    const multiplier = entry.holiday_multiplier || 1;
                    amount = hours * entry.custom_hourly_rate * multiplier;
                  }
                  else if (entry.custom_daily_rate) {
                    const multiplier = entry.holiday_multiplier || 1;
                    amount = entry.custom_daily_rate * multiplier;
                  }
                  // Priority 3: Job rates with optional multiplier (ONLY hourly/daily, NOT salary)
                  else if (entry.jobs && (entry.jobs.pay_type === 'hourly' || entry.jobs.pay_type === 'daily')) {
                    const job = entry.jobs;
                    const multiplier = entry.holiday_multiplier || 1;

                    if (job.pay_type === 'hourly' && job.hourly_rate && hours > 0) {
                      amount = hours * job.hourly_rate * multiplier;
                    } else if (job.pay_type === 'daily' && job.daily_rate) {
                      amount = job.daily_rate * multiplier;
                    }
                  }

                  if (amount > 0) {
                    return (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {entry.status === 'completed' ? 'Earned' : 'Expected'}
                        </p>
                        <p className={`font-semibold ${
                          entry.status === 'completed'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {getCurrencySymbol(currency)} {formatCurrency(amount)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
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
            const formattedDate = recordDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={`financial-${record.id}`}
                onClick={() => handleFinancialClick(record)}
                className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  isIncome ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left side: Date and Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base">
                        {formattedDate}
                      </h3>
                      {isIncome ? (
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium">
                        {isIncome ? 'Income' : 'Expense'}
                      </span>
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
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className={`text-lg font-bold ${
                      isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isIncome ? '+' : '-'}{getCurrencySymbol(record.currency)}{Number(record.amount).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
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

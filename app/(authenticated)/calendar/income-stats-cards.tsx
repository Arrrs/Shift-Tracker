"use client";

import { useState, useEffect } from "react";
import { StatCard } from "./stat-card";
import { getCurrencySymbol, formatCurrency, formatHours } from "@/lib/utils/time-format";
import { getFixedIncomeForMonth } from "../finances/actions";
import { getMonthlyFinancialSummary } from "../finances/actions";

interface IncomeStatsCardsProps {
  currentDate: Date;
  shiftIncomeByCurrency: Record<string, number>;
  shiftIncomeByJob: Array<{jobId: string; jobName: string; amount: number; hours: number; shifts: number}>;
  fixedIncomeJobIds: string[];
  fixedIncomeShiftCounts: Record<string, number>;
  loading: boolean;
}

export function IncomeStatsCards({
  currentDate,
  shiftIncomeByCurrency,
  shiftIncomeByJob,
  fixedIncomeJobIds,
  fixedIncomeShiftCounts,
  loading,
}: IncomeStatsCardsProps) {
  const [fixedIncome, setFixedIncome] = useState<any>(null);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [loadingFinancials, setLoadingFinancials] = useState(true);

  // Load fixed income and financial records
  useEffect(() => {
    async function loadFinancials() {
      setLoadingFinancials(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const [fixedResult, summaryResult] = await Promise.all([
        getFixedIncomeForMonth(year, month),
        getMonthlyFinancialSummary(year, month),
      ]);

      if (!fixedResult.error) {
        setFixedIncome(fixedResult.fixedIncome);
      }

      if (!summaryResult.error) {
        setFinancialSummary(summaryResult.summary);
      }

      setLoadingFinancials(false);
    }

    loadFinancials();
  }, [currentDate]);

  // NEVER MIX CURRENCIES - show per currency
  // We'll display the primary currency (first one found) and warn if multiple currencies exist

  const hasMixedCurrencies =
    Object.keys(shiftIncomeByCurrency).length > 1 ||
    (fixedIncome && Object.keys(fixedIncome).length > 1) ||
    (financialSummary && Object.keys(financialSummary).length > 1);

  // Use the first currency found in shift income, or default to USD
  const primaryCurrency = Object.keys(shiftIncomeByCurrency)[0] || 'USD';

  const shiftIncomeTotal = shiftIncomeByCurrency[primaryCurrency] || 0;

  const fixedIncomeTotal = fixedIncome && fixedIncome[primaryCurrency]
    ? fixedIncome[primaryCurrency].total
    : 0;

  // Merge shift income and fixed income into a single "Total Earnings" value
  const totalEarnings = shiftIncomeTotal + fixedIncomeTotal;

  const otherIncomeTotal = financialSummary && financialSummary[primaryCurrency]
    ? financialSummary[primaryCurrency].income
    : 0;

  const expensesTotal = financialSummary && financialSummary[primaryCurrency]
    ? financialSummary[primaryCurrency].expense
    : 0;

  // Only calculate net income if all are in the same currency
  const netIncome = totalEarnings + otherIncomeTotal - expensesTotal;

  return (
    <div className="grid gap-3">
      {/* Total Earnings Card (combines shift income + fixed income) */}
      <StatCard
        cardId="total-earnings"
        title="Total Earnings"
        icon="💼"
        value={
          loading || loadingFinancials ? (
            "..."
          ) : totalEarnings === 0 ? (
            `${getCurrencySymbol(primaryCurrency)}0`
          ) : (
            `${getCurrencySymbol(primaryCurrency)}${formatCurrency(totalEarnings)}`
          )
        }
        loading={loading || loadingFinancials}
        gradient="bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
        border="border border-blue-500/20"
        textColor="text-blue-600 dark:text-blue-400"
        expandedContent={
          shiftIncomeByJob.length > 0 || fixedIncome ? (
            <div className="space-y-3">
              {/* Shift-based earnings */}
              {shiftIncomeByJob.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Hourly/Shift Work</div>
                  {shiftIncomeByJob.map((job) => (
                    <div key={job.jobId} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{job.jobName}:</span>
                      <span className="font-medium">
                        {getCurrencySymbol(primaryCurrency)}
                        {formatCurrency(job.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="text-[10px] text-muted-foreground">
                    {shiftIncomeByJob.reduce((sum, j) => sum + j.shifts, 0)} shifts,{" "}
                    {formatHours(shiftIncomeByJob.reduce((sum, j) => sum + j.hours, 0))}
                  </div>
                </div>
              )}

              {/* Fixed income (salary/monthly) */}
              {fixedIncome && (
                <div className="space-y-2 pt-2 border-t border-current/10">
                  <div className="text-xs font-semibold text-muted-foreground">Fixed Income</div>
                  {Object.entries(fixedIncome as Record<string, {byJob: Array<{jobName: string; amount: number; payType: string}>}>).map(([currency, data]) =>
                    data.byJob.map((job) => (
                      <div key={job.jobName} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{job.jobName}:</span>
                        <span className="font-medium">
                          {getCurrencySymbol(currency)}
                          {formatCurrency(job.amount)}/mo
                        </span>
                      </div>
                    ))
                  )}
                  {Object.keys(fixedIncomeShiftCounts).length > 0 && (
                    <div className="text-[10px] text-muted-foreground">
                      {Object.values(fixedIncomeShiftCounts).reduce((sum, count) => sum + count, 0)} shifts tracked
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Other Income Card */}
      <StatCard
        cardId="other-income"
        title="Other Income"
        icon="💰"
        value={
          loadingFinancials ? (
            "..."
          ) : otherIncomeTotal === 0 ? (
            `${getCurrencySymbol(primaryCurrency)}0`
          ) : (
            `${getCurrencySymbol(primaryCurrency)}${formatCurrency(otherIncomeTotal)}`
          )
        }
        loading={loadingFinancials}
        gradient="bg-gradient-to-br from-green-500/10 to-emerald-500/10"
        border="border border-green-500/20"
        textColor="text-green-600 dark:text-green-400"
        expandedContent={
          financialSummary && otherIncomeTotal > 0 ? (
            <div className="space-y-2">
              {Object.entries(financialSummary as Record<string, {incomeByCategory: Record<string, {amount: number; icon: string}>}>).map(([currency, data]) =>
                Object.entries(data.incomeByCategory).map(([catName, catData]) => (
                  <div key={catName} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {catData.icon} {catName}:
                    </span>
                    <span className="font-medium">
                      {getCurrencySymbol(currency)}
                      {formatCurrency(catData.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : undefined
        }
      />

      {/* Expenses Card */}
      <StatCard
        cardId="expenses"
        title="Expenses"
        icon="💸"
        value={
          loadingFinancials ? (
            "..."
          ) : expensesTotal === 0 ? (
            `${getCurrencySymbol(primaryCurrency)}0`
          ) : (
            `${getCurrencySymbol(primaryCurrency)}${formatCurrency(expensesTotal)}`
          )
        }
        loading={loadingFinancials}
        gradient="bg-gradient-to-br from-red-500/10 to-orange-500/10"
        border="border border-red-500/20"
        textColor="text-red-600 dark:text-red-400"
        expandedContent={
          financialSummary && expensesTotal > 0 ? (
            <div className="space-y-2">
              {Object.entries(financialSummary as Record<string, {expenseByCategory: Record<string, {amount: number; icon: string}>}>).map(([currency, data]) =>
                Object.entries(data.expenseByCategory).map(([catName, catData]) => (
                  <div key={catName} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {catData.icon} {catName}:
                    </span>
                    <span className="font-medium">
                      {getCurrencySymbol(currency)}
                      {formatCurrency(catData.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : undefined
        }
      />

      {/* Net Income Card */}
      <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20 rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-2">💵 Net Income</p>
        {loading || loadingFinancials ? (
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">...</div>
        ) : (
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {getCurrencySymbol(primaryCurrency)}
            {formatCurrency(netIncome)}
          </div>
        )}
        {hasMixedCurrencies && (
          <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-1">
            ⚠️ Multiple currencies detected - showing {primaryCurrency} only
          </p>
        )}
      </div>
    </div>
  );
}

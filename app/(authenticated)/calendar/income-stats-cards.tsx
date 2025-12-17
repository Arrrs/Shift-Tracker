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

  // Calculate totals by currency (never mix currencies)
  const totalEarningsByCurrency: Record<string, number> = {};
  const otherIncomeByCurrency: Record<string, number> = {};
  const expensesByCurrency: Record<string, number> = {};
  const netIncomeByCurrency: Record<string, number> = {};

  // Add shift income
  Object.entries(shiftIncomeByCurrency).forEach(([currency, amount]) => {
    totalEarningsByCurrency[currency] = (totalEarningsByCurrency[currency] || 0) + amount;
  });

  // Add fixed income
  if (fixedIncome) {
    Object.entries(fixedIncome as Record<string, {total: number}>).forEach(([currency, data]) => {
      totalEarningsByCurrency[currency] = (totalEarningsByCurrency[currency] || 0) + data.total;
    });
  }

  // Add other income by currency
  if (financialSummary) {
    Object.entries(financialSummary as Record<string, {income: number; expense: number}>).forEach(([currency, data]) => {
      otherIncomeByCurrency[currency] = data.income;
      expensesByCurrency[currency] = data.expense;
    });
  }

  // Calculate net income by currency
  const allCurrencies = new Set([
    ...Object.keys(totalEarningsByCurrency),
    ...Object.keys(otherIncomeByCurrency),
    ...Object.keys(expensesByCurrency)
  ]);

  allCurrencies.forEach(currency => {
    const earnings = totalEarningsByCurrency[currency] || 0;
    const otherIncome = otherIncomeByCurrency[currency] || 0;
    const expenses = expensesByCurrency[currency] || 0;
    netIncomeByCurrency[currency] = earnings + otherIncome - expenses;
  });

  return (
    <div className="grid gap-2.5 lg:grid-cols-2">
      {/* Total Earnings Card (combines shift income + fixed income) */}
      <StatCard
        cardId="total-earnings"
        title="Total Earnings"
        icon="💼"
        value={
          loading || loadingFinancials ? (
            "..."
          ) : Object.keys(totalEarningsByCurrency).length === 0 ? (
            "$0"
          ) : Object.keys(totalEarningsByCurrency).length === 1 ? (
            Object.entries(totalEarningsByCurrency).map(([currency, amount]) => (
              `${getCurrencySymbol(currency)}${formatCurrency(amount)}`
            ))[0]
          ) : (
            <div className="space-y-0.5">
              {Object.entries(totalEarningsByCurrency).map(([currency, amount]) => (
                <div key={currency} className="text-xl font-bold">
                  {getCurrencySymbol(currency)}{formatCurrency(amount)}
                </div>
              ))}
            </div>
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
          ) : Object.keys(otherIncomeByCurrency).length === 0 ? (
            "$0"
          ) : Object.keys(otherIncomeByCurrency).length === 1 ? (
            Object.entries(otherIncomeByCurrency).map(([currency, amount]) => (
              `${getCurrencySymbol(currency)}${formatCurrency(amount)}`
            ))[0]
          ) : (
            <div className="space-y-0.5">
              {Object.entries(otherIncomeByCurrency).map(([currency, amount]) => (
                <div key={currency} className="text-xl font-bold">
                  {getCurrencySymbol(currency)}{formatCurrency(amount)}
                </div>
              ))}
            </div>
          )
        }
        loading={loadingFinancials}
        gradient="bg-gradient-to-br from-green-500/10 to-emerald-500/10"
        border="border border-green-500/20"
        textColor="text-green-600 dark:text-green-400"
        expandedContent={
          financialSummary && Object.values(otherIncomeByCurrency).some(v => v > 0) ? (
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
          ) : Object.keys(expensesByCurrency).length === 0 ? (
            "$0"
          ) : Object.keys(expensesByCurrency).length === 1 ? (
            Object.entries(expensesByCurrency).map(([currency, amount]) => (
              `${getCurrencySymbol(currency)}${formatCurrency(amount)}`
            ))[0]
          ) : (
            <div className="space-y-0.5">
              {Object.entries(expensesByCurrency).map(([currency, amount]) => (
                <div key={currency} className="text-xl font-bold">
                  {getCurrencySymbol(currency)}{formatCurrency(amount)}
                </div>
              ))}
            </div>
          )
        }
        loading={loadingFinancials}
        gradient="bg-gradient-to-br from-red-500/10 to-orange-500/10"
        border="border border-red-500/20"
        textColor="text-red-600 dark:text-red-400"
        expandedContent={
          financialSummary && Object.values(expensesByCurrency).some(v => v > 0) ? (
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
      <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1.5">💵 Net Income</p>
        {loading || loadingFinancials ? (
          <div className="text-xl font-bold text-gray-600 dark:text-gray-400">...</div>
        ) : Object.keys(netIncomeByCurrency).length === 0 ? (
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">$0</div>
        ) : Object.keys(netIncomeByCurrency).length === 1 ? (
          Object.entries(netIncomeByCurrency).map(([currency, amount]) => (
            <div key={currency} className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {getCurrencySymbol(currency)}{formatCurrency(amount)}
            </div>
          ))
        ) : (
          <div className="space-y-0.5">
            {Object.entries(netIncomeByCurrency).map(([currency, amount]) => (
              <div key={currency} className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {getCurrencySymbol(currency)}{formatCurrency(amount)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

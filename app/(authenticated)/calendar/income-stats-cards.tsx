"use client";

import { useMemo } from "react";
import { StatCard } from "./stat-card";
import { getCurrencySymbol, formatCurrency, formatHours } from "@/lib/utils/time-format";
import { useFinancialRecords } from "@/lib/hooks/use-financial-records";
import { useIncomeRecords } from "@/lib/hooks/use-income-records";
import { usePrimaryCurrency } from "@/lib/hooks/use-user-settings";

interface IncomeStatsCardsProps {
  currentDate: Date;
  shiftIncomeByCurrency: Record<string, number>;
  expectedShiftIncomeByCurrency: Record<string, number>;
  expectedFinancialIncomeByCurrency: Record<string, number>;
  expectedFinancialExpenseByCurrency: Record<string, number>;
  shiftIncomeByJob: Array<{jobId: string; jobName: string; amount: number; hours: number; shifts: number}>;
  fixedIncomeJobIds: string[];
  fixedIncomeShiftCounts: Record<string, number>;
  loading: boolean;
}

export function IncomeStatsCards({
  currentDate,
  shiftIncomeByCurrency,
  expectedShiftIncomeByCurrency,
  expectedFinancialIncomeByCurrency,
  expectedFinancialExpenseByCurrency,
  shiftIncomeByJob,
  fixedIncomeJobIds,
  fixedIncomeShiftCounts,
  loading,
}: IncomeStatsCardsProps) {
  const primaryCurrency = usePrimaryCurrency();

  // Calculate date range for current month
  const { startDate, endDate } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      startDate: `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`,
      endDate: `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`,
    };
  }, [currentDate]);

  // Use React Query hooks for financial data (this will auto-refresh when data changes!)
  const { data: financialRecords = [], isLoading: loadingFinancials } = useFinancialRecords(startDate, endDate);

  // Calculate financial records income/expense by currency (completed only) using useMemo
  const { otherIncomeByCurrency, expensesByCurrency, incomeByCategory, expenseByCategory } = useMemo(() => {
    const otherIncomeByCurrency: Record<string, number> = {};
    const expensesByCurrency: Record<string, number> = {};
    const incomeByCategory: Record<string, Record<string, { amount: number; icon: string }>> = {};
    const expenseByCategory: Record<string, Record<string, { amount: number; icon: string }>> = {};

    financialRecords.forEach(record => {
      if (record.status === 'completed') {
        // CRITICAL: Only add to aggregation if currency is set
        if (!record.currency) {
          console.warn('WARNING: Financial record has no currency, skipping:', record.id);
          return;
        }
        const currency = record.currency;
        const amount = Number(record.amount);

        if (record.type === 'income') {
          otherIncomeByCurrency[currency] = (otherIncomeByCurrency[currency] || 0) + amount;

          // Group by category
          if (record.financial_categories) {
            if (!incomeByCategory[currency]) incomeByCategory[currency] = {};
            const catName = record.financial_categories.name;
            const catIcon = record.financial_categories.icon || '💰';

            if (!incomeByCategory[currency][catName]) {
              incomeByCategory[currency][catName] = { amount: 0, icon: catIcon };
            }
            incomeByCategory[currency][catName].amount += amount;
          }
        } else if (record.type === 'expense') {
          expensesByCurrency[currency] = (expensesByCurrency[currency] || 0) + amount;

          // Group by category
          if (record.financial_categories) {
            if (!expenseByCategory[currency]) expenseByCategory[currency] = {};
            const catName = record.financial_categories.name;
            const catIcon = record.financial_categories.icon || '💸';

            if (!expenseByCategory[currency][catName]) {
              expenseByCategory[currency][catName] = { amount: 0, icon: catIcon };
            }
            expenseByCategory[currency][catName].amount += amount;
          }
        }
      }
    });

    return { otherIncomeByCurrency, expensesByCurrency, incomeByCategory, expenseByCategory };
  }, [financialRecords]);

  // Calculate totals by currency (never mix currencies)
  const totalEarningsByCurrency: Record<string, number> = {};
  const netIncomeByCurrency: Record<string, number> = {};

  // Add shift income
  Object.entries(shiftIncomeByCurrency).forEach(([currency, amount]) => {
    totalEarningsByCurrency[currency] = (totalEarningsByCurrency[currency] || 0) + amount;
  });

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

  // Calculate Total Expected Income (combining shift + financial expected income)
  const totalExpectedIncomeByCurrency: Record<string, number> = {};
  Object.entries(expectedShiftIncomeByCurrency).forEach(([currency, amount]) => {
    totalExpectedIncomeByCurrency[currency] = (totalExpectedIncomeByCurrency[currency] || 0) + amount;
  });
  Object.entries(expectedFinancialIncomeByCurrency).forEach(([currency, amount]) => {
    totalExpectedIncomeByCurrency[currency] = (totalExpectedIncomeByCurrency[currency] || 0) + amount;
  });

  return (
    <div className="grid gap-2.5 lg:grid-cols-2">
      {/* Row 1: Net Income | Total Expected Income */}
      {/* Net Income Card */}
      <div className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1.5">💵 Net Income</p>
        {loading || loadingFinancials ? (
          <div className="text-xl font-bold text-gray-600 dark:text-gray-400">...</div>
        ) : Object.keys(netIncomeByCurrency).length === 0 ? (
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{getCurrencySymbol(primaryCurrency)}{formatCurrency(0)}</div>
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

      {/* Total Expected Income Card (combines all expected income sources) */}
      {Object.keys(totalExpectedIncomeByCurrency).length > 0 && (
        <StatCard
          cardId="total-expected-income"
          title="Total Expected Income"
          icon="📈"
          value={
            loading ? (
              "..."
            ) : Object.keys(totalExpectedIncomeByCurrency).length === 1 ? (
              Object.entries(totalExpectedIncomeByCurrency).map(([currency, amount]) => (
                `${getCurrencySymbol(currency)}${formatCurrency(amount)}`
              ))[0]
            ) : (
              <div className="space-y-0.5">
                {Object.entries(totalExpectedIncomeByCurrency).map(([currency, amount]) => (
                  <div key={currency} className="text-xl font-bold">
                    {getCurrencySymbol(currency)}{formatCurrency(amount)}
                  </div>
                ))}
              </div>
            )
          }
          loading={loading}
          gradient="bg-gradient-to-br from-violet-500/10 to-purple-500/10"
          border="border border-violet-500/20"
          textColor="text-violet-600 dark:text-violet-400"
          expandedContent={
            Object.keys(totalExpectedIncomeByCurrency).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(expectedShiftIncomeByCurrency).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground">From Shifts:</div>
                    {Object.entries(expectedShiftIncomeByCurrency).map(([currency, amount]) => (
                      <div key={`shift-${currency}`} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">💼 {currency}:</span>
                        <span className="font-medium">
                          {getCurrencySymbol(currency)}{formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {Object.entries(expectedFinancialIncomeByCurrency).length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground">From Other Income:</div>
                    {Object.entries(expectedFinancialIncomeByCurrency).map(([currency, amount]) => (
                      <div key={`financial-${currency}`} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">💰 {currency}:</span>
                        <span className="font-medium">
                          {getCurrencySymbol(currency)}{formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : undefined
          }
        />
      )}

      {/* Row 2: Expenses | Expected Expenses */}
      {/* Expenses Card */}
      <StatCard
        cardId="expenses"
        title="Expenses"
        icon="💸"
        value={
          loadingFinancials ? (
            "..."
          ) : Object.keys(expensesByCurrency).length === 0 ? (
            `${getCurrencySymbol(primaryCurrency)}${formatCurrency(0)}`
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
          Object.values(expensesByCurrency).some(v => v > 0) ? (
            <div className="space-y-2">
              {Object.entries(expenseByCategory).map(([currency, categories]) =>
                Object.entries(categories).map(([catName, catData]) => (
                  <div key={`${currency}-${catName}`} className="flex justify-between text-xs">
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

      {/* Expected Financial Expenses Card (from planned financial records) */}
      {Object.keys(expectedFinancialExpenseByCurrency).length > 0 && (
        <StatCard
          cardId="expected-financial-expenses"
          title="Expected Expenses"
          icon="📉"
          value={
            loading ? (
              "..."
            ) : Object.keys(expectedFinancialExpenseByCurrency).length === 1 ? (
              Object.entries(expectedFinancialExpenseByCurrency).map(([currency, amount]) => (
                `${getCurrencySymbol(currency)}${formatCurrency(amount)}`
              ))[0]
            ) : (
              <div className="space-y-0.5">
                {Object.entries(expectedFinancialExpenseByCurrency).map(([currency, amount]) => (
                  <div key={currency} className="text-xl font-bold">
                    {getCurrencySymbol(currency)}{formatCurrency(amount)}
                  </div>
                ))}
              </div>
            )
          }
          loading={loading}
          gradient="bg-gradient-to-br from-orange-500/10 to-amber-500/10"
          border="border border-orange-500/20"
          textColor="text-orange-600 dark:text-orange-400"
        />
      )}

      {/* Row 3: Total Earnings | Expected Shift Income */}
      {/* Total Earnings Card (combines shift income + fixed income) */}
      <StatCard
        cardId="total-earnings"
        title="Total Earnings"
        icon="💼"
        value={
          loading || loadingFinancials ? (
            "..."
          ) : Object.keys(totalEarningsByCurrency).length === 0 ? (
            `${getCurrencySymbol(primaryCurrency)}${formatCurrency(0)}`
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
          shiftIncomeByJob.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Completed Shifts</div>
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
          ) : undefined
        }
      />

      {/* Expected Shift Income Card (from planned/in-progress shifts) */}
      {Object.keys(expectedShiftIncomeByCurrency).length > 0 && (
        <StatCard
          cardId="expected-shift-income"
          title="Expected Shift Income"
          icon="📅"
          value={
            loading ? (
              "..."
            ) : Object.keys(expectedShiftIncomeByCurrency).length === 1 ? (
              Object.entries(expectedShiftIncomeByCurrency).map(([currency, amount]) => (
                `${getCurrencySymbol(currency)}${formatCurrency(amount)}`
              ))[0]
            ) : (
              <div className="space-y-0.5">
                {Object.entries(expectedShiftIncomeByCurrency).map(([currency, amount]) => (
                  <div key={currency} className="text-xl font-bold">
                    {getCurrencySymbol(currency)}{formatCurrency(amount)}
                  </div>
                ))}
              </div>
            )
          }
          loading={loading}
          gradient="bg-gradient-to-br from-amber-500/10 to-yellow-500/10"
          border="border border-amber-500/20"
          textColor="text-amber-600 dark:text-amber-400"
        />
      )}

      {/* Row 4: Other Income | Expected Other Income */}
      {/* Other Income Card */}
      <StatCard
        cardId="other-income"
        title="Other Income"
        icon="💰"
        value={
          loadingFinancials ? (
            "..."
          ) : Object.keys(otherIncomeByCurrency).length === 0 ? (
            `${getCurrencySymbol(primaryCurrency)}${formatCurrency(0)}`
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
          Object.values(otherIncomeByCurrency).some(v => v > 0) ? (
            <div className="space-y-2">
              {Object.entries(incomeByCategory).map(([currency, categories]) =>
                Object.entries(categories).map(([catName, catData]) => (
                  <div key={`${currency}-${catName}`} className="flex justify-between text-xs">
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

      {/* Expected Other Income Card (from planned financial records) */}
      {Object.keys(expectedFinancialIncomeByCurrency).length > 0 && (
        <StatCard
          cardId="expected-financial-income"
          title="Expected Other Income"
          icon="📊"
          value={
            loading ? (
              "..."
            ) : Object.keys(expectedFinancialIncomeByCurrency).length === 1 ? (
              Object.entries(expectedFinancialIncomeByCurrency).map(([currency, amount]) => (
                `${getCurrencySymbol(currency)}${formatCurrency(amount)}`
              ))[0]
            ) : (
              <div className="space-y-0.5">
                {Object.entries(expectedFinancialIncomeByCurrency).map(([currency, amount]) => (
                  <div key={currency} className="text-xl font-bold">
                    {getCurrencySymbol(currency)}{formatCurrency(amount)}
                  </div>
                ))}
              </div>
            )
          }
          loading={loading}
          gradient="bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
          border="border border-emerald-500/20"
          textColor="text-emerald-600 dark:text-emerald-400"
        />
      )}
    </div>
  );
}

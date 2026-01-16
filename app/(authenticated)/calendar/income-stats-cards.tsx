"use client";

import { StatCard } from "./stat-card";
import { getCurrencySymbol, formatCurrency } from "@/lib/utils/time-format";
import { usePrimaryCurrency } from "@/lib/hooks/use-user-settings";

interface IncomeStatsCardsProps {
  shiftIncomeByCurrency: Record<string, number>;
  expectedShiftIncomeByCurrency: Record<string, number>;
  financialIncomeByCurrency: Record<string, number>;
  financialExpenseByCurrency: Record<string, number>;
  expectedFinancialIncomeByCurrency: Record<string, number>;
  expectedFinancialExpenseByCurrency: Record<string, number>;
  loading: boolean;
}

export function IncomeStatsCards({
  shiftIncomeByCurrency,
  expectedShiftIncomeByCurrency,
  financialIncomeByCurrency,
  financialExpenseByCurrency,
  expectedFinancialIncomeByCurrency,
  expectedFinancialExpenseByCurrency,
  loading,
}: IncomeStatsCardsProps) {
  const primaryCurrency = usePrimaryCurrency();

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
    ...Object.keys(financialIncomeByCurrency),
    ...Object.keys(financialExpenseByCurrency)
  ]);

  allCurrencies.forEach(currency => {
    const earnings = totalEarningsByCurrency[currency] || 0;
    const otherIncome = financialIncomeByCurrency[currency] || 0;
    const expenses = financialExpenseByCurrency[currency] || 0;
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
        {loading ? (
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
        />
      )}

      {/* Row 2: Expenses | Expected Expenses */}
      {/* Expenses Card */}
      <StatCard
        cardId="expenses"
        title="Expenses"
        icon="💸"
        value={
          loading ? (
            "..."
          ) : Object.keys(financialExpenseByCurrency).length === 0 ? (
            `${getCurrencySymbol(primaryCurrency)}${formatCurrency(0)}`
          ) : Object.keys(financialExpenseByCurrency).length === 1 ? (
            Object.entries(financialExpenseByCurrency).map(([currency, amount]) => (
              `${getCurrencySymbol(currency)}${formatCurrency(amount)}`
            ))[0]
          ) : (
            <div className="space-y-0.5">
              {Object.entries(financialExpenseByCurrency).map(([currency, amount]) => (
                <div key={currency} className="text-xl font-bold">
                  {getCurrencySymbol(currency)}{formatCurrency(amount)}
                </div>
              ))}
            </div>
          )
        }
        loading={loading}
        gradient="bg-gradient-to-br from-red-500/10 to-orange-500/10"
        border="border border-red-500/20"
        textColor="text-red-600 dark:text-red-400"
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
          loading ? (
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
        loading={loading}
        gradient="bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
        border="border border-blue-500/20"
        textColor="text-blue-600 dark:text-blue-400"
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
          loading ? (
            "..."
          ) : Object.keys(financialIncomeByCurrency).length === 0 ? (
            `${getCurrencySymbol(primaryCurrency)}${formatCurrency(0)}`
          ) : Object.keys(financialIncomeByCurrency).length === 1 ? (
            Object.entries(financialIncomeByCurrency).map(([currency, amount]) => (
              `${getCurrencySymbol(currency)}${formatCurrency(amount)}`
            ))[0]
          ) : (
            <div className="space-y-0.5">
              {Object.entries(financialIncomeByCurrency).map(([currency, amount]) => (
                <div key={currency} className="text-xl font-bold">
                  {getCurrencySymbol(currency)}{formatCurrency(amount)}
                </div>
              ))}
            </div>
          )
        }
        loading={loading}
        gradient="bg-gradient-to-br from-green-500/10 to-emerald-500/10"
        border="border border-green-500/20"
        textColor="text-green-600 dark:text-green-400"
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

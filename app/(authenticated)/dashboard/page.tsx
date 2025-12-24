"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Clock, Calendar, DollarSign } from "lucide-react";
import { useTimeEntries } from "@/lib/hooks/use-time-entries";
import { useFinancialRecords } from "@/lib/hooks/use-financial-records";
import { useIncomeRecords } from "@/lib/hooks/use-income-records";
import { Database } from "@/lib/database.types";
import { getCurrencySymbol, formatHours, formatCurrency } from "@/lib/utils/time-format";
import { useTranslation } from "@/lib/i18n/use-translation";

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
  shift_templates: Database["public"]["Tables"]["shift_templates"]["Row"] | null;
};

type FinancialRecord = Database["public"]["Tables"]["financial_records"]["Row"] & {
  financial_categories?: Database["public"]["Tables"]["financial_categories"]["Row"] | null;
  jobs?: Database["public"]["Tables"]["jobs"]["Row"] | null;
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const [currentDate] = useState(new Date());

  // Calculate date ranges
  const { startDate, endDate, threeMonthsStartDate, threeMonthsEndDate, year, month } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = firstDay.toISOString().split("T")[0];
    const endDate = lastDay.toISOString().split("T")[0];

    // Get data for last 3 months (for chart)
    const threeMonthsAgo = new Date(year, month - 2, 1);
    const threeMonthsStartDate = threeMonthsAgo.toISOString().split("T")[0];
    const threeMonthsEndDate = lastDay.toISOString().split("T")[0];

    return { startDate, endDate, threeMonthsStartDate, threeMonthsEndDate, year, month };
  }, [currentDate]);

  // Use React Query hooks to fetch data
  const { data: currentMonthEntries = [], isLoading: isLoadingEntries } = useTimeEntries(startDate, endDate);
  const { data: currentMonthFinancials = [], isLoading: isLoadingFinancials } = useFinancialRecords(startDate, endDate);
  const { data: currentMonthIncome = [], isLoading: isLoadingIncome } = useIncomeRecords(startDate, endDate);
  const { data: threeMonthIncome = [], isLoading: isLoadingThreeMonthIncome } = useIncomeRecords(threeMonthsStartDate, threeMonthsEndDate);
  const { data: threeMonthFinancials = [], isLoading: isLoadingThreeMonthFinancials } = useFinancialRecords(threeMonthsStartDate, threeMonthsEndDate);

  const loading = isLoadingEntries || isLoadingFinancials || isLoadingIncome || isLoadingThreeMonthIncome || isLoadingThreeMonthFinancials;

  // Calculate stats using useMemo
  const stats = useMemo(() => {
    const timeEntries = currentMonthEntries as TimeEntry[];
    const incomeRecords = currentMonthIncome;
    const financials = currentMonthFinancials as FinancialRecord[];

    // Calculate hours
    const completedEntries = timeEntries.filter(e => e.status === 'completed');
    const totalActualHours = completedEntries.reduce((sum, e) => sum + (e.actual_hours || 0), 0);
    const totalScheduledHours = timeEntries.filter(e => e.status !== 'cancelled').reduce((sum, e) => sum + (e.scheduled_hours || 0), 0);
    const completedShifts = completedEntries.length;
    const plannedShifts = timeEntries.filter(e => e.status === 'planned').length;
    const inProgressShifts = timeEntries.filter(e => e.status === 'in_progress').length;

    // Calculate shift income by currency from income_records
    const shiftIncomeByCurrency: Record<string, number> = {};
    incomeRecords.forEach(record => {
      const currency = record.currency || 'USD';
      shiftIncomeByCurrency[currency] = (shiftIncomeByCurrency[currency] || 0) + record.amount;
    });

    // Calculate financial records income/expense by currency (completed only)
    const financialIncomeByCurrency: Record<string, number> = {};
    const financialExpenseByCurrency: Record<string, number> = {};
    financials.forEach(record => {
      if (record.status === 'completed') {
        const currency = record.currency || 'USD';
        if (record.type === 'income') {
          financialIncomeByCurrency[currency] = (financialIncomeByCurrency[currency] || 0) + Number(record.amount);
        } else if (record.type === 'expense') {
          financialExpenseByCurrency[currency] = (financialExpenseByCurrency[currency] || 0) + Number(record.amount);
        }
      }
    });

    // Combine all earnings by currency (shifts + financial income - financial expenses)
    const earningsByCurrency: Record<string, number> = {};

    // Add shift income
    Object.entries(shiftIncomeByCurrency).forEach(([currency, amount]) => {
      earningsByCurrency[currency] = (earningsByCurrency[currency] || 0) + amount;
    });

    // Add financial income
    Object.entries(financialIncomeByCurrency).forEach(([currency, amount]) => {
      earningsByCurrency[currency] = (earningsByCurrency[currency] || 0) + amount;
    });

    // Subtract expenses
    Object.entries(financialExpenseByCurrency).forEach(([currency, amount]) => {
      earningsByCurrency[currency] = (earningsByCurrency[currency] || 0) - amount;
    });

    return {
      totalActualHours,
      totalScheduledHours,
      completedShifts,
      plannedShifts,
      inProgressShifts,
      earningsByCurrency,
      shiftIncomeByCurrency,
    };
  }, [currentMonthEntries, currentMonthIncome, currentMonthFinancials]);

  // Calculate yearly data for chart using useMemo
  const { yearlyData, yearlyTotalByCurrency } = useMemo(() => {
    // Group by month and currency
    const monthlyEarnings: Record<string, Record<string, number>> = {};

    // Add shift income by currency
    threeMonthIncome.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const currency = record.currency || 'USD';

      if (!monthlyEarnings[monthKey]) {
        monthlyEarnings[monthKey] = {};
      }
      monthlyEarnings[monthKey][currency] = (monthlyEarnings[monthKey][currency] || 0) + record.amount;
    });

    // Add/subtract financial records by currency
    (threeMonthFinancials as FinancialRecord[]).forEach(record => {
      if (record.status === 'completed') {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const currency = record.currency || 'USD';

        if (!monthlyEarnings[monthKey]) {
          monthlyEarnings[monthKey] = {};
        }

        const amount = Number(record.amount);
        if (record.type === 'income') {
          monthlyEarnings[monthKey][currency] = (monthlyEarnings[monthKey][currency] || 0) + amount;
        } else if (record.type === 'expense') {
          monthlyEarnings[monthKey][currency] = (monthlyEarnings[monthKey][currency] || 0) - amount;
        }
      }
    });

    // Generate chart data for last 3 months
    const chartData: Array<{month: string, earningsByCurrency: Record<string, number>}> = [];
    const totalByCurrency: Record<string, number> = {};

    for (let i = 2; i >= 0; i--) {
      const targetDate = new Date(year, month - i, 1);
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });

      const earningsByCurrency = monthlyEarnings[monthKey] || {};

      // Round each currency amount
      const roundedEarnings: Record<string, number> = {};
      Object.entries(earningsByCurrency).forEach(([currency, amount]) => {
        const rounded = Math.round(amount * 100) / 100;
        roundedEarnings[currency] = rounded;
        totalByCurrency[currency] = (totalByCurrency[currency] || 0) + rounded;
      });

      chartData.push({
        month: monthName,
        earningsByCurrency: roundedEarnings,
      });
    }

    // Round totals
    Object.keys(totalByCurrency).forEach(currency => {
      totalByCurrency[currency] = Math.round(totalByCurrency[currency] * 100) / 100;
    });

    return { yearlyData: chartData, yearlyTotalByCurrency: totalByCurrency };
  }, [threeMonthIncome, threeMonthFinancials, year, month]);

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const totalShifts = stats.completedShifts + stats.plannedShifts + stats.inProgressShifts;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get all unique currencies and find the maximum value across all currencies and months
  const allCurrencies = Array.from(new Set(yearlyData.flatMap(d => Object.keys(d.earningsByCurrency))));
  const allValues = yearlyData.flatMap(d => Object.values(d.earningsByCurrency).map(val => Math.abs(val)));
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
  // Add 10% padding at the top for cleaner look
  const maxEarnings = maxValue * 1.1;

  console.log('Chart Debug:', {
    yearlyData,
    allCurrencies,
    allValues,
    maxValue,
    maxEarnings
  });

  // Define colors for different currencies
  const currencyColors: Record<string, string> = {
    'USD': 'bg-blue-500/80 hover:bg-blue-500',
    'EUR': 'bg-green-500/80 hover:bg-green-500',
    'GBP': 'bg-purple-500/80 hover:bg-purple-500',
    'UAH': 'bg-yellow-500/80 hover:bg-yellow-500',
    'PLN': 'bg-pink-500/80 hover:bg-pink-500',
    'CZK': 'bg-orange-500/80 hover:bg-orange-500',
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("dashboard")}</h1>
        <p className="text-muted-foreground">
          {t("overviewFor")} {monthYear}
        </p>
      </div>

      {/* Last 3 Months Income Chart */}
      {yearlyData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>{t("lastThreeMonths")}</CardTitle>
                  <CardDescription>{t("incomeByCurrency")}</CardDescription>
                </div>
                <div className="sm:text-right">
                  <div className="space-y-1">
                    {Object.entries(yearlyTotalByCurrency).map(([currency, total]) => (
                      <div key={currency} className="flex items-center gap-2 sm:justify-end">
                        <span className="text-lg font-bold">
                          {getCurrencySymbol(currency)}{formatCurrency(total)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t("total")} (3 {t("months")})</p>
                </div>
              </div>
              {/* Currency Legend */}
              {allCurrencies.length > 1 && (
                <div className="flex flex-wrap gap-3">
                  {allCurrencies.map(currency => (
                    <div key={currency} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${currencyColors[currency] || 'bg-primary/80'}`} />
                      <span className="text-xs text-muted-foreground">{currency}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Chart container */}
            <div className="w-full overflow-x-auto -mx-2 px-2">
              <div className="min-w-[50px]">
                {/* Chart area with fixed height */}
                <div className="h-64 flex items-end justify-center gap-8 mb-4">
                  {yearlyData.map((data, index) => (
                    <div key={index} className="flex-1 flex items-end justify-center gap-2">
                      {allCurrencies.map(currency => {
                        const earnings = data.earningsByCurrency[currency] || 0;
                        const colorClass = currencyColors[currency] || 'bg-primary/80 hover:bg-primary';
                        const heightPx = maxEarnings > 0 ? Math.floor((Math.abs(earnings) / maxEarnings) * 240) : 0;

                        console.log(`${data.month} ${currency}:`, earnings, 'heightPx:', heightPx);

                        return (
                          <div
                            key={currency}
                            className="flex-1 max-w-[30px] md:max-w-[50px] relative group cursor-pointer"
                          >
                            {earnings !== 0 && (
                              <div
                                className={`w-full ${earnings > 0 ? colorClass : 'bg-red-500/80 hover:bg-red-500'} rounded-t transition-all duration-300`}
                                style={{
                                  height: Math.max(heightPx, 12) + 'px'
                                }}
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs font-medium rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border">
                                  {getCurrencySymbol(currency)}{formatCurrency(earnings)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Month labels */}
                <div className="flex items-center justify-center gap-8">
                  {yearlyData.map((data, index) => (
                    <div key={index} className="flex-1 text-center">
                      <div className="text-sm text-muted-foreground font-medium">
                        {data.month}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Net Income Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("netIncome")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {Object.keys(stats.earningsByCurrency).length === 0 ? (
              <div className="text-2xl font-bold">
                {getCurrencySymbol('USD')}0.00
              </div>
            ) : (
              <div className="space-y-1">
                {Object.entries(stats.earningsByCurrency).map(([currency, amount]) => (
                  <div key={currency} className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {getCurrencySymbol(currency)}{formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t("totalEarningsThisMonth")}
            </p>
          </CardContent>
        </Card>

        {/* Hours Worked Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("hoursWorked")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHours(stats.totalActualHours)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalScheduledHours > 0 && (
                <>{t("of")} {formatHours(stats.totalScheduledHours)} {t("scheduled")}</>
              )}
              {stats.totalScheduledHours === 0 && <>{t("completedThisMonth")}</>}
            </p>
          </CardContent>
        </Card>

        {/* Shifts Overview Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("shifts")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShifts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedShifts} {t("completed")}, {stats.plannedShifts} {t("planned")}
              {stats.inProgressShifts > 0 && <>, {stats.inProgressShifts} {t("inProgress")}</>}
            </p>
          </CardContent>
        </Card>

        {/* Shift Income Card */}
        {Object.keys(stats.shiftIncomeByCurrency).length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("shiftIncome")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.shiftIncomeByCurrency).map(([currency, amount]) => (
                  <div key={currency} className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {getCurrencySymbol(currency)}{formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("of")} {stats.completedShifts} {t("completed")} shift{stats.completedShifts !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Completion Rate Card */}
        {totalShifts > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("completionRate")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats.completedShifts / totalShifts) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedShifts} {t("of")} {totalShifts} {t("shiftsCompleted")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Average Hours per Shift */}
        {stats.completedShifts > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("avgHoursPerShift")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatHours(stats.totalActualHours / stats.completedShifts)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("perCompletedShift")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

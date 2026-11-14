import { useState, useMemo } from 'react';
import {
  Download,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SummaryCard from '../components/ui/SummaryCard';
import StatusBadge from '../components/ui/StatusBadge';
import FilterDropdown from '../components/ui/FilterDropdown';
import {
  ExpenseDonutChart,
  MonthlyComparisonBarChart,
  HorizontalBarList,
} from '../components/ui/Charts';
import { useApp } from '../context/useApp';
import {
  buildMonthlyComparison,
  computeHouseholdSummary,
  formatPHP,
  formatDateShort,
  downloadCSV,
} from '../utils/finance';

const matchesPeriod = (date, period) => period === 'all' || date?.startsWith(period);

export default function ReportsAnalyticsPage() {
  const {
    bills,
    budgets,
    categories,
    contributions,
    payments,
    members,
    addToast,
    settings,
  } = useApp();

  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [reportTab, setReportTab] = useState('overview');

  const periodOptions = useMemo(() => {
    const months = new Set([new Date().toISOString().slice(0, 7)]);
    for (const value of [
      ...bills.map((bill) => bill.dueDate),
      ...budgets.map((budget) => budget.month),
      ...contributions.map((item) => item.contributionDate),
      ...payments.map((payment) => payment.paymentDate),
    ]) {
      if (/^\d{4}-\d{2}/.test(value || '')) months.add(value.slice(0, 7));
    }
    return [...months].sort((a, b) => b.localeCompare(a)).map((month) => ({
      value: month,
      label: new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(`${month}-01T00:00:00.000Z`)),
    }));
  }, [bills, budgets, contributions, payments]);

  const periodBills = useMemo(() => bills.filter((bill) => matchesPeriod(bill.dueDate, period)), [bills, period]);
  const periodBudgets = useMemo(() => budgets.filter((budget) => matchesPeriod(budget.month, period)), [budgets, period]);
  const periodContributions = useMemo(() => contributions.filter((item) => matchesPeriod(item.contributionDate, period)), [contributions, period]);
  const periodPayments = useMemo(() => payments.filter((payment) => matchesPeriod(payment.paymentDate, period)), [payments, period]);

  const summary = useMemo(
    () => computeHouseholdSummary({ bills: periodBills, budgets: periodBudgets, contributions: periodContributions, payments: periodPayments }),
    [periodBills, periodBudgets, periodContributions, periodPayments]
  );

  const monthlyComparison = useMemo(
    () => buildMonthlyComparison({ bills, budgets, contributions }),
    [bills, budgets, contributions]
  );
  const sixMonthExpenses = monthlyComparison.reduce((sum, month) => sum + month.expenses, 0);
  const recordedMonths = monthlyComparison.filter((month) => month.expenses > 0).length;
  const annualizedProjection = recordedMonths ? Math.round((sixMonthExpenses / recordedMonths) * 12) : 0;
  const historyRange = monthlyComparison.length
    ? `${monthlyComparison[0].month} – ${monthlyComparison[monthlyComparison.length - 1].month}`
    : 'No recorded months';
  const selectedPeriodLabel = period === 'all'
    ? 'All recorded periods'
    : periodOptions.find((option) => option.value === period)?.label || period;

  const categoryBreakdown = useMemo(() => {
    return categories
      .map((cat) => {
        const spent = periodBills
          .filter((b) => b.categoryId === cat.id)
          .reduce((s, b) => s + Number(b.amount || 0), 0);
        const allocated = periodBudgets
          .filter((budget) => budget.categoryId === cat.id)
          .reduce((sum, budget) => sum + Number(budget.allocatedAmount || 0), 0);
        const alertThresholdPct = Number(
          periodBudgets.find((budget) => budget.categoryId === cat.id)?.alertThresholdPct
          || settings.autoAlertBudgetPct
          || 85
        );
        const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
        return {
          id: cat.id,
          label: cat.name,
          value: spent,
          allocated,
          pct,
          alertThresholdPct,
          color: cat.color,
        };
      })
      .filter((c) => c.value > 0 || c.allocated > 0);
  }, [categories, periodBills, periodBudgets, settings.autoAlertBudgetPct]);

  const memberContributionStats = useMemo(() => {
    const maxVal = Math.max(
      1,
      ...members.map((m) =>
          periodContributions
          .filter((c) => c.memberId === m.id && c.status === 'Confirmed')
          .reduce((s, c) => s + Number(c.amount || 0), 0)
      )
    );
    return members.map((m) => {
      const confirmed = periodContributions
        .filter((c) => c.memberId === m.id && c.status === 'Confirmed')
        .reduce((s, c) => s + Number(c.amount || 0), 0);
      const pending = periodContributions
        .filter((c) => c.memberId === m.id && c.status === 'Pending')
        .reduce((s, c) => s + Number(c.amount || 0), 0);
      return {
        id: m.id,
        label: m.name,
        confirmed,
        pending,
        primaryText: formatPHP(confirmed),
        secondaryText: pending > 0 ? `${formatPHP(pending)} pending` : 'Verified',
        pct: Math.round((confirmed / maxVal) * 100),
      };
    });
  }, [members, periodContributions]);

  const outstandingBills = summary.enrichedBills.filter(
    (b) => b.financials.remainingBillBalance > 0
  );

  const handleExportCSV = () => {
    const headers = [
      'Bill Title',
      'Provider',
      'Category',
      'Due Date',
      'Total Billed (PHP)',
      'Confirmed Contributions (PHP)',
      'Actual Paid to Provider (PHP)',
      'Remaining Balance (PHP)',
      'Provider Payment Status',
    ];
    const rows = summary.enrichedBills.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      return [
        b.title,
        b.provider,
        cat?.name || '',
        b.dueDate,
        b.amount,
        b.financials.confirmedContributions,
        b.financials.actualPaid,
        b.financials.remainingBillBalance,
        b.financials.paymentStatus,
      ];
    });
    downloadCSV(`bill-ihin-report-${period}.csv`, headers, rows);
    addToast(`Exported financial report for ${period === 'all' ? 'all periods' : period}.`, 'success');
  };

  return (
    <DashboardLayout pageTitle="Reports & Analytics">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#64748B]">
          Comprehensive household spending, budget variance, member contribution shares, and payment audit reports.
        </p>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <FilterDropdown
            label="Reporting Period"
            value={period}
            onChange={setPeriod}
            allLabel="All recorded periods"
            options={periodOptions}
          />
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Monthly Expenses (Selected)"
          value={formatPHP(summary.totalExpenses)}
          subtitle={`Budget variance for ${selectedPeriodLabel}: ${formatPHP(summary.remainingBudget)}`}
          icon={BarChart3}
          tone="cyan"
        />
        <SummaryCard
          title="Annualized Yearly Expenses"
          value={formatPHP(annualizedProjection)}
          subtitle={`6-month actual total: ${formatPHP(sixMonthExpenses)}`}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Outstanding Bill Balances"
          value={formatPHP(summary.totalOutstandingAmount)}
          subtitle={`${outstandingBills.length} bills remaining unpaid/partial`}
          icon={AlertCircle}
          tone={outstandingBills.length > 0 ? 'amber' : 'green'}
        />
        <SummaryCard
          title="Settled Provider Payments"
          value={formatPHP(summary.totalActualPaid)}
          subtitle={`${payments.length} verified disbursement receipts`}
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      {/* Report Section Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Monthly & Yearly Trends' },
          { id: 'budget', label: 'Budget vs Actual' },
          { id: 'members', label: 'Member Contributions' },
          { id: 'outstanding', label: 'Outstanding & Payments' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setReportTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              reportTab === tab.id
                ? 'bg-white text-[#1E293B] border border-[#E2E8F0] shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview & Trends */}
      {(reportTab === 'overview' || reportTab === 'budget') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#1E293B]">
                  Monthly vs Yearly Expense Trajectory
                </h2>
                <p className="text-xs text-[#64748B]">
                  Budget allocations, billed obligations, and confirmed contributions ({historyRange})
                </p>
              </div>
              <Calendar className="w-4 h-4 text-[#64748B]" />
            </div>
            <MonthlyComparisonBarChart data={monthlyComparison} />
          </div>

          <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Category Breakdown</h2>
              <p className="text-xs text-[#64748B]">Share of household expenses by category</p>
            </div>
            <ExpenseDonutChart items={categoryBreakdown} compact />
          </div>
        </div>
      )}

      {/* Budget vs Actual Spending */}
      {(reportTab === 'overview' || reportTab === 'budget') && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">
              Budget vs Actual Spending Variance
            </h2>
            <p className="text-xs text-[#64748B]">
              Category-by-category utilization against recorded budget caps
            </p>
          </div>
          <HorizontalBarList
            items={categoryBreakdown.map((c) => ({
              label: c.label,
              primaryText: formatPHP(c.value),
              secondaryText: formatPHP(c.allocated),
              pct: c.pct,
              tone: c.pct > 100 ? 'red' : c.pct >= c.alertThresholdPct ? 'amber' : 'cyan',
            }))}
          />
        </div>
      )}

      {/* Member Contributions Analytics */}
      {(reportTab === 'overview' || reportTab === 'members') && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">
              Member Contributions Summary
            </h2>
            <p className="text-xs text-[#64748B]">
              Confirmed flexible contributions compared across all household members
            </p>
          </div>
          <HorizontalBarList items={memberContributionStats} showPercentage={false} />
        </div>
      )}

      {/* Outstanding Bills & Payment History Tables */}
      {(reportTab === 'overview' || reportTab === 'outstanding') && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#1E293B]">
                Outstanding Bills ({outstandingBills.length})
              </h2>
              <p className="text-xs text-[#64748B]">Bills with remaining balance owed to providers</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="px-4 py-3">Bill</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {outstandingBills.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 font-semibold text-[#1E293B]">{b.title}</td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                        {formatDateShort(b.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-700 tabular-nums">
                        {formatPHP(b.financials.remainingBillBalance)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.financials.paymentStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#1E293B]">
                Provider Payment History ({payments.length})
              </h2>
              <p className="text-xs text-[#64748B]">Settled disbursements to external service providers</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="px-4 py-3">Bill</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Receipt Ref</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {payments.map((p) => {
                    const bill = bills.find((b) => b.id === p.billId);
                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-semibold text-[#1E293B]">
                          {bill?.title || 'Household Bill'}
                        </td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                          {formatDateShort(p.paymentDate)}
                        </td>
                        <td className="px-4 py-3 font-mono-tabular text-[#64748B]">
                          {p.receiptReference}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700 tabular-nums">
                          {formatPHP(p.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

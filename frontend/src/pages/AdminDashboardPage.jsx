import { useState, useMemo } from 'react';
import {
  Wallet,
  ReceiptText,
  PiggyBank,
  ShieldCheck,
  AlertCircle,
  CalendarClock,
  Plus,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SummaryCard from '../components/ui/SummaryCard';
import StatusBadge from '../components/ui/StatusBadge';
import { ExpenseDonutChart, HorizontalBarList } from '../components/ui/Charts';
import BillFormModal from '../components/modals/BillFormModal';
import PaymentFormModal from '../components/modals/PaymentFormModal';
import { useApp } from '../context/useApp';
import { computeHouseholdSummary, formatPHP, formatDateShort } from '../utils/finance';

export default function AdminDashboardPage() {
  const {
    bills,
    budgets,
    contributions,
    payments,
    categories,
    members,
    activities,
    navigateTo,
    verifyContribution,
    settings,
  } = useApp();

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payBillId, setPayBillId] = useState('');
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthLabel = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${currentMonth}-01T00:00:00.000Z`));
  const currentMonthBills = useMemo(
    () => bills.filter((bill) => bill.dueDate?.startsWith(currentMonth)),
    [bills, currentMonth]
  );
  const currentMonthBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === currentMonth),
    [budgets, currentMonth]
  );

  const summary = useMemo(
    () => computeHouseholdSummary({
      bills: currentMonthBills,
      budgets: currentMonthBudgets,
      contributions: contributions.filter((item) => item.contributionDate?.startsWith(currentMonth)),
      payments: payments.filter((payment) => payment.paymentDate?.startsWith(currentMonth)),
    }),
    [currentMonth, currentMonthBills, currentMonthBudgets, contributions, payments]
  );

  // Expense Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    return categories
      .map((cat) => {
        const value = currentMonthBills
          .filter((b) => b.categoryId === cat.id)
          .reduce((s, b) => s + Number(b.amount || 0), 0);
        return { label: cat.name, value, color: cat.color };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, currentMonthBills]);

  // Member Contribution Overview (Confirmed only)
  const memberContribBars = useMemo(() => {
    const maxMemberTotal = Math.max(
      1,
      ...members.map((m) =>
        contributions
          .filter((c) => c.memberId === m.id && c.status === 'Confirmed')
          .reduce((s, c) => s + Number(c.amount || 0), 0)
      )
    );
    return members.map((m) => {
      const confirmed = contributions
        .filter((c) => c.memberId === m.id && c.status === 'Confirmed')
        .reduce((s, c) => s + Number(c.amount || 0), 0);
      const pending = contributions
        .filter((c) => c.memberId === m.id && c.status === 'Pending')
        .reduce((s, c) => s + Number(c.amount || 0), 0);
      return {
        label: m.name,
        primaryText: formatPHP(confirmed),
        secondaryText: pending > 0 ? `+${formatPHP(pending)} pending` : '',
        pct: Math.round((confirmed / maxMemberTotal) * 100),
        tone: 'cyan',
      };
    });
  }, [members, contributions]);

  const upcomingAndOutstanding = useMemo(() => {
    return summary.enrichedBills
      .filter((b) => b.financials.remainingBillBalance > 0)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 6);
  }, [summary.enrichedBills]);

  const pendingVerificationList = useMemo(() => {
    return contributions.filter((c) => c.status === 'Pending');
  }, [contributions]);

  const utilColor =
    summary.budgetUtilizationPct > 100
      ? 'bg-red-500'
      : summary.budgetUtilizationPct >= Number(settings.autoAlertBudgetPct || 85)
      ? 'bg-amber-500'
      : 'bg-[#00DCE5]';

  return (
    <DashboardLayout pageTitle="Administrator Dashboard">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#64748B]">
            {currentMonthLabel} Cycle · Separate tracking of household budgets, verified member contributions, and actual bill payments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setPayBillId('');
              setPaymentModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-sm font-semibold text-[#1E293B] whitespace-nowrap shrink-0"
          >
            Record Payment
          </button>
          <button
            type="button"
            onClick={() => setBillModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Household Bill
          </button>
        </div>
      </div>

      {/* 6 Core Admin KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <SummaryCard
          title="Monthly Household Budget"
          value={formatPHP(summary.totalBudget)}
          subtitle={`${budgets.length} active category plans`}
          icon={Wallet}
          tone="cyan"
          onClick={() => navigateTo('budgets')}
          actionLabel="Manage Budgets"
        />
        <SummaryCard
          title="Total Household Expenses"
          value={formatPHP(summary.totalExpenses)}
          subtitle={`${bills.length} bills & expenses logged`}
          icon={ReceiptText}
          onClick={() => navigateTo('bills')}
          actionLabel="View Bills"
        />
        <SummaryCard
          title="Remaining Budget"
          value={formatPHP(summary.remainingBudget)}
          subtitle={`${summary.budgetUtilizationPct}% of monthly budget utilized`}
          icon={PiggyBank}
          tone={summary.remainingBudget < 0 ? 'red' : 'green'}
        />
        <SummaryCard
          title="Total Confirmed Contributions"
          value={formatPHP(summary.totalConfirmedContributions)}
          subtitle={`${formatPHP(summary.totalPendingContributions)} pending verification`}
          icon={ShieldCheck}
          tone="green"
          onClick={() => navigateTo('contributions')}
          actionLabel="Verify Queue"
        />
        <SummaryCard
          title="Outstanding Bills"
          value={formatPHP(summary.totalOutstandingAmount)}
          subtitle={`${summary.outstandingCount} unpaid / partial (${summary.overdueCount} overdue)`}
          icon={AlertCircle}
          tone={summary.overdueCount > 0 ? 'red' : 'amber'}
          onClick={() => navigateTo('payments')}
          actionLabel="Settle Bills"
        />
        <SummaryCard
          title="Upcoming Bills"
          value={`${summary.upcomingCount} Due Soon`}
          subtitle={`Actual paid to providers: ${formatPHP(summary.totalActualPaid)}`}
          icon={CalendarClock}
          tone="amber"
          onClick={() => navigateTo('bills')}
          actionLabel="Schedule"
        />
      </div>

      {/* Budget Utilization Progress + Quick Verification Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Budget Utilization Progress</h2>
              <p className="text-xs text-[#64748B]">
                Comparing total logged household bills against planned category allocations
              </p>
            </div>
            <span className="text-lg font-extrabold text-[#1E293B] tabular-nums">
              {summary.budgetUtilizationPct}%
            </span>
          </div>
          <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${utilColor}`}
              style={{ width: `${Math.min(100, summary.budgetUtilizationPct)}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
            <div>
              <p className="text-[#64748B]">Planned Budget</p>
              <p className="font-bold text-[#1E293B] tabular-nums mt-0.5">
                {formatPHP(summary.totalBudget)}
              </p>
            </div>
            <div>
              <p className="text-[#64748B]">Actual Provider Paid</p>
              <p className="font-bold text-emerald-700 tabular-nums mt-0.5">
                {formatPHP(summary.totalActualPaid)}
              </p>
            </div>
            <div>
              <p className="text-[#64748B]">Remaining Unpaid</p>
              <p className="font-bold text-amber-700 tabular-nums mt-0.5">
                {formatPHP(summary.totalOutstandingAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Contributions Quick Action */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Pending Verifications</h2>
              <p className="text-xs text-[#64748B]">
                Confirm member contributions before counting them in funded pools
              </p>
            </div>
            <StatusBadge status={`${pendingVerificationList.length} Pending`} />
          </div>

          {pendingVerificationList.length === 0 ? (
            <p className="text-xs text-[#64748B] py-4">
              All member contributions have been reviewed.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingVerificationList.slice(0, 3).map((c) => {
                const mem = members.find((m) => m.id === c.memberId);
                const bill = bills.find((b) => b.id === c.billId);
                return (
                  <div key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1E293B] truncate">
                        {mem?.name} · <span className="tabular-nums">{formatPHP(c.amount)}</span>
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">
                        {bill?.title} ({c.paymentChannel})
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigateTo('contribution-details', { contributionId: c.id })}
                        className="px-2.5 py-1 rounded-md border border-[#E2E8F0] text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => verifyContribution(c.id)}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Confirm
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expense Breakdown Chart & Member Contribution Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Expense Breakdown Chart</h2>
              <p className="text-xs text-[#64748B]">Monthly bill distribution across household categories</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('reports')}
              className="text-xs font-semibold text-[#0E7490] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              Full Analytics
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <ExpenseDonutChart items={categoryBreakdown} />
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Member Contribution Overview</h2>
              <p className="text-xs text-[#64748B]">Confirmed contributions for {currentMonthLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('contributions')}
              className="text-xs font-semibold text-[#0E7490] hover:underline whitespace-nowrap shrink-0"
            >
              View All
            </button>
          </div>
          <HorizontalBarList items={memberContribBars} showPercentage={false} />
        </div>
      </div>

      {/* Upcoming Bills Table & Recent Household Activities */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Upcoming &amp; Outstanding Bills</h2>
              <p className="text-xs text-[#64748B]">
                Tracks both Confirmed Contributions and Actual Provider Payments separately
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('bills')}
              className="text-xs font-semibold text-[#0E7490] hover:underline whitespace-nowrap shrink-0"
            >
              All Bills
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                  <th className="px-4 py-3">Bill &amp; Provider</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Bill Total</th>
                  <th className="px-4 py-3 text-right">Confirmed Contribs</th>
                  <th className="px-4 py-3 text-right">Paid to Provider</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {upcomingAndOutstanding.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => navigateTo('bill-details', { billId: b.id })}
                        className="font-semibold text-[#1E293B] hover:text-[#0E7490] text-left"
                      >
                        {b.title}
                      </button>
                      <p className="text-[11px] text-[#64748B]">{b.provider}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                      {formatDateShort(b.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatPHP(b.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0E7490] tabular-nums">
                      {formatPHP(b.financials.confirmedContributions)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700 tabular-nums">
                      {formatPHP(b.financials.actualPaid)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.financials.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setPayBillId(b.id);
                          setPaymentModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#E6FBFC] hover:bg-[#00DCE5] text-[#0E7490] hover:text-[#1E293B] font-semibold whitespace-nowrap shrink-0 transition-colors"
                      >
                        Pay Provider
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1E293B]">Recent Household Activities</h2>
            <button
              type="button"
              onClick={() => navigateTo('notifications')}
              className="text-xs font-semibold text-[#0E7490] hover:underline"
            >
              Alerts
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {activities.slice(0, 6).map((act) => (
              <div key={act.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-xs font-semibold text-[#1E293B]">{act.actor}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{act.action}</p>
                <p className="text-[11px] text-slate-400 tabular-nums mt-1">{act.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BillFormModal isOpen={billModalOpen} onClose={() => setBillModalOpen(false)} />
      <PaymentFormModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultBillId={payBillId}
      />
    </DashboardLayout>
  );
}

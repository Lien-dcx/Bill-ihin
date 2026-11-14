import { useState, useMemo } from 'react';
import {
  Wallet,
  HandCoins,
  Clock,
  ClipboardList,
  Plus,
  CalendarClock,
  ArrowUpRight,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SummaryCard from '../components/ui/SummaryCard';
import StatusBadge from '../components/ui/StatusBadge';
import ContributionFormModal from '../components/modals/ContributionFormModal';
import { useApp } from '../context/useApp';
import {
  computeHouseholdSummary,
  computeMemberSummary,
  formatPHP,
  formatDateShort,
} from '../utils/finance';

export default function MemberDashboardPage() {
  const {
    currentUser,
    bills,
    budgets,
    contributions,
    assignments,
    payments,
    categories,
    navigateTo,
  } = useApp();

  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [selectedBillForContrib, setSelectedBillForContrib] = useState('');
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthLabel = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${currentMonth}-01T00:00:00.000Z`));
  const currentMonthBills = useMemo(
    () => bills.filter((bill) => bill.dueDate?.startsWith(currentMonth)),
    [bills, currentMonth]
  );

  const householdSummary = useMemo(
    () => computeHouseholdSummary({
      bills: currentMonthBills,
      budgets: budgets.filter((budget) => budget.month === currentMonth),
      contributions: contributions.filter((item) => item.contributionDate?.startsWith(currentMonth)),
      payments: payments.filter((payment) => payment.paymentDate?.startsWith(currentMonth)),
    }),
    [currentMonth, currentMonthBills, budgets, contributions, payments]
  );

  const memberSummary = useMemo(
    () =>
      computeMemberSummary({
        memberId: currentUser.id,
        bills,
        contributions,
        assignments,
        payments,
      }),
    [currentUser.id, bills, contributions, assignments, payments]
  );

  const upcomingDeadlines = useMemo(() => {
    return [...memberSummary.myAssignments].sort((a, b) =>
      a.deadline.localeCompare(b.deadline)
    );
  }, [memberSummary.myAssignments]);

  const categorySummary = useMemo(() => {
    return categories
      .map((c) => {
        const spent = currentMonthBills
          .filter((b) => b.categoryId === c.id)
          .reduce((s, b) => s + Number(b.amount || 0), 0);
        return { id: c.id, name: c.name, spent, color: c.color };
      })
      .filter((c) => c.spent > 0)
      .slice(0, 5);
  }, [categories, currentMonthBills]);

  return (
    <DashboardLayout pageTitle="Member Dashboard">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#64748B]">
            Welcome back, <strong className="text-[#1E293B]">{currentUser.name}</strong>. Submit flexible contributions toward assigned or open household bills.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedBillForContrib('');
            setContribModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Submit Contribution
        </button>
      </div>

      {/* Member KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Household Budget"
          value={formatPHP(householdSummary.totalBudget)}
          subtitle={`${householdSummary.budgetUtilizationPct}% used (${formatPHP(householdSummary.totalExpenses)})`}
          icon={Wallet}
          tone="cyan"
          onClick={() => navigateTo('household-overview')}
          actionLabel="Overview"
        />
        <SummaryCard
          title="Confirmed Contributions"
          value={formatPHP(memberSummary.confirmedTotal)}
          subtitle={`${memberSummary.totalSubmissions} personal submissions`}
          icon={HandCoins}
          tone="green"
          onClick={() => navigateTo('contributions')}
          actionLabel="History"
        />
        <SummaryCard
          title="Pending Verification"
          value={formatPHP(memberSummary.pendingTotal)}
          subtitle={
            memberSummary.rejectedCount > 0
              ? `${memberSummary.rejectedCount} rejected needs review`
              : 'Awaiting admin review'
          }
          icon={Clock}
          tone={memberSummary.rejectedCount > 0 ? 'red' : 'amber'}
        />
        <SummaryCard
          title="Assigned Bills"
          value={`${memberSummary.myAssignments.length} Active`}
          subtitle="Flexible partial or target shares"
          icon={ClipboardList}
          onClick={() => navigateTo('assignments')}
          actionLabel="View All"
        />
      </div>

      {/* Assigned Bills & Upcoming Payment Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">My Assigned Bills &amp; Deadlines</h2>
              <p className="text-xs text-[#64748B]">
                Contribute any partial or full amount before the deadline
              </p>
            </div>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              You currently have no direct bill assignments. You can still submit voluntary contributions to any household bill.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {upcomingDeadlines.map((asg) => (
                <div
                  key={asg.id}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FAFC]"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          asg.bill && navigateTo('bill-details', { billId: asg.bill.id })
                        }
                        className="text-sm font-bold text-[#1E293B] hover:text-[#0E7490] text-left"
                      >
                        {asg.bill?.title || 'Household Bill'}
                      </button>
                      <StatusBadge status={asg.priority} />
                    </div>
                    <p className="text-xs text-[#64748B] flex flex-wrap items-center gap-2 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Deadline: {formatDateShort(asg.deadline)}
                      </span>
                      <span>·</span>
                      <span>
                        Suggested Target:{' '}
                        <strong className="text-[#1E293B]">
                          {asg.targetAmount > 0 ? formatPHP(asg.targetAmount) : 'Flexible'}
                        </strong>
                      </span>
                      {asg.targetAmount > 0 && (
                        <>
                          <span>·</span>
                          <span>
                            Confirmed: <strong className="text-emerald-700">{formatPHP(asg.contributedTowardTarget)}</strong>
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBillForContrib(asg.billId);
                      setContribModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-xs font-bold whitespace-nowrap shrink-0"
                  >
                    Contribute Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Household Expense Summary */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Household Expense Summary</h2>
              <p className="text-xs text-[#64748B]">Top spending categories for {currentMonthLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('bills')}
              className="text-xs font-semibold text-[#0E7490] hover:underline inline-flex items-center gap-1"
            >
              All Bills
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {categorySummary.map((cat) => {
              const pct =
                householdSummary.totalExpenses > 0
                  ? Math.round((cat.spent / householdSummary.totalExpenses) * 100)
                  : 0;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1E293B]">{cat.name}</span>
                    <span className="tabular-nums text-[#64748B]">
                      <strong className="text-[#1E293B]">{formatPHP(cat.spent)}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Personal Contribution History */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">Personal Contribution History</h2>
            <p className="text-xs text-[#64748B]">
              Track verification status and administrator notes on every submission
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('contributions')}
            className="text-xs font-semibold text-[#0E7490] hover:underline"
          >
            View Full Ledger
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                <th className="px-4 py-3">Bill / Expense</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Verification Status</th>
                <th className="px-4 py-3">Notes / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {memberSummary.myContribs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#64748B]">
                    No contributions recorded yet. Click "Submit Contribution" to add one.
                  </td>
                </tr>
              ) : (
                memberSummary.myContribs.map((c) => {
                  const bill = bills.find((b) => b.id === c.billId);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigateTo('contribution-details', { contributionId: c.id })}
                      className="hover:bg-[#F8FAFC] cursor-pointer"
                    >
                      <td className="px-4 py-3 font-semibold text-[#1E293B]">
                        {bill?.title || 'Household Bill'}
                      </td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                        {formatDateShort(c.contributionDate)}
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">{c.paymentChannel}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        {formatPHP(c.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-[#64748B] max-w-xs truncate">
                        {c.status === 'Rejected' && c.rejectionReason
                          ? c.rejectionReason
                          : c.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContributionFormModal
        isOpen={contribModalOpen}
        onClose={() => setContribModalOpen(false)}
        defaultBillId={selectedBillForContrib}
      />
    </DashboardLayout>
  );
}

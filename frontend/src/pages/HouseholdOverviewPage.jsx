import {
  Home,
  Users,
  Wallet,
  ShieldCheck,
  CreditCard,
  Copy,
  ArrowRight,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SummaryCard from '../components/ui/SummaryCard';
import StatusBadge from '../components/ui/StatusBadge';
import { MonthlyComparisonBarChart } from '../components/ui/Charts';
import { useApp } from '../context/useApp';
import { buildMonthlyComparison, computeHouseholdSummary, formatPHP } from '../utils/finance';

export default function HouseholdOverviewPage() {
  const {
    household,
    members,
    bills,
    budgets,
    contributions,
    payments,
    navigateTo,
    addToast,
    isAdmin,
  } = useApp();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const summary = computeHouseholdSummary({
    bills: bills.filter((bill) => bill.dueDate?.startsWith(currentMonth)),
    budgets: budgets.filter((budget) => budget.month === currentMonth),
    contributions: contributions.filter((item) => item.contributionDate?.startsWith(currentMonth)),
    payments: payments.filter((payment) => payment.paymentDate?.startsWith(currentMonth)),
  });
  const monthlyComparison = buildMonthlyComparison({ bills, budgets, contributions });

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(household.inviteCode);
      addToast('Invite code copied to clipboard.', 'success');
    } catch {
      addToast('Clipboard access was blocked. Select and copy the invite code manually.', 'error');
    }
  };

  return (
    <DashboardLayout pageTitle="Household Overview">
      {/* Household Identity Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E6FBFC] border border-[#00DCE5]/40 text-[#0E7490] flex items-center justify-center shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1E293B]">{household.name}</h2>
            <p className="text-sm text-[#64748B]">{household.address}</p>
            <p className="text-xs text-[#64748B] tabular-nums">
              Billing Cycle Day {household.billingCycleDay} · Active since {household.createdAt} · Currency: {household.currency} ({household.currencySymbol})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {isAdmin && (
          <div className="px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5">
            <div>
              <p className="text-[10px] font-semibold text-[#64748B]">Household Invite Code</p>
              <p className="text-xs font-bold font-mono-tabular text-[#1E293B]">
                {household.inviteCode}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyInvite}
              aria-label="Copy invite code"
              className="p-1.5 rounded-md hover:bg-white border border-transparent hover:border-[#E2E8F0] text-[#0E7490]"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          )}
          {isAdmin && (
          <button
            type="button"
            onClick={() => navigateTo('settings')}
            className="px-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#1E293B] whitespace-nowrap shrink-0"
          >
            Household Settings
          </button>
          )}
        </div>
      </div>

      {/* 4 Key Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Household Members"
          value={`${members.filter((m) => m.status === 'Active').length} Members`}
          subtitle={`${members.filter((m) => m.status === 'Active' && m.role === 'Administrator').length} Admin · ${members.filter((m) => m.status === 'Active' && m.role === 'Member').length} Contributors`}
          icon={Users}
          tone="cyan"
          onClick={isAdmin ? () => navigateTo('members') : undefined}
          actionLabel={isAdmin ? 'Manage' : undefined}
        />
        <SummaryCard
          title="Current Month Budget Plan"
          value={formatPHP(summary.totalBudget)}
          subtitle={`${formatPHP(summary.remainingBudget)} remaining`}
          icon={Wallet}
          onClick={isAdmin ? () => navigateTo('budgets') : undefined}
          actionLabel={isAdmin ? 'Budgets' : undefined}
        />
        <SummaryCard
          title="Confirmed Member Pool"
          value={formatPHP(summary.totalConfirmedContributions)}
          subtitle={`${formatPHP(summary.totalPendingContributions)} pending review`}
          icon={ShieldCheck}
          tone="green"
          onClick={() => navigateTo('contributions')}
          actionLabel="Contributions"
        />
        <SummaryCard
          title="Paid to Providers"
          value={formatPHP(summary.totalActualPaid)}
          subtitle={`${formatPHP(summary.totalOutstandingAmount)} still owed to billers`}
          icon={CreditCard}
          tone="amber"
          onClick={isAdmin ? () => navigateTo('payments') : undefined}
          actionLabel={isAdmin ? 'Payments' : undefined}
        />
      </div>

      {/* 6-Month Cashflow Comparison */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">
              6-Month Household Budget, Expenses &amp; Contributions
            </h2>
            <p className="text-xs text-[#64748B]">
              Visualizing historical consistency across billing cycles
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('reports')}
            className="text-xs font-semibold text-[#0E7490] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            Open Full Reports
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <MonthlyComparisonBarChart data={monthlyComparison} />
      </div>

      {/* Household Roster Summary */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">Household Members &amp; Contribution Roles</h2>
            <p className="text-xs text-[#64748B]">
              Each member contributes flexibly based on capacity rather than fixed equal splits
            </p>
          </div>
          {isAdmin && <button
            type="button"
            onClick={() => navigateTo('members')}
            className="text-xs font-semibold text-[#0E7490] hover:underline"
          >
            Manage Members
          </button>}
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {members.map((m) => {
            const confirmed = contributions
              .filter((c) => c.memberId === m.id && c.status === 'Confirmed')
              .reduce((s, c) => s + Number(c.amount || 0), 0);
            const pending = contributions
              .filter((c) => c.memberId === m.id && c.status === 'Pending')
              .reduce((s, c) => s + Number(c.amount || 0), 0);
            return (
              <div
                key={m.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: m.avatarBg || '#0E7490' }}
                  >
                    {m.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1E293B] truncate">{m.name}</p>
                      <StatusBadge status={m.role} />
                    </div>
                    <p className="text-xs text-[#64748B] truncate">
                      {m.relationship} · {m.monthlyIncomeShareNote}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0 text-xs tabular-nums">
                  <div className="text-right">
                    <p className="text-[#64748B]">Confirmed</p>
                    <p className="font-bold text-emerald-700">{formatPHP(confirmed)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#64748B]">Pending</p>
                    <p className="font-bold text-amber-700">{formatPHP(pending)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

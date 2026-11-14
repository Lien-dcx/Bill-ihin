import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  HandCoins,
  CreditCard,
  Users,
  Calendar,
  Building2,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import BillFormModal from '../components/modals/BillFormModal';
import ContributionFormModal from '../components/modals/ContributionFormModal';
import PaymentFormModal from '../components/modals/PaymentFormModal';
import { useApp } from '../context/useApp';
import { computeBillFinancials, formatPHP, formatDateShort } from '../utils/finance';

export default function BillDetailsPage() {
  const {
    bills,
    selectedBillId,
    categories,
    contributions,
    payments,
    assignments,
    members,
    isAdmin,
    navigateTo,
    deleteBill,
    verifyContribution,
  } = useApp();

  const bill = bills.find((b) => b.id === selectedBillId) || bills[0];

  const [editOpen, setEditOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const financials = useMemo(
    () => (bill ? computeBillFinancials(bill, contributions, payments) : null),
    [bill, contributions, payments]
  );

  if (!bill || !financials) {
    return (
      <DashboardLayout pageTitle="Bill Details">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-[#64748B]">No bill selected or the bill was deleted.</p>
          <button
            type="button"
            onClick={() => navigateTo('bills')}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] text-[#1E293B] text-sm font-bold"
          >
            Back to Bills &amp; Expenses
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const category = categories.find((c) => c.id === bill.categoryId);
  const billContribs = contributions.filter((c) => c.billId === bill.id);
  const billPayments = payments.filter((p) => p.billId === bill.id);
  const billAssignments = assignments.filter((a) => a.billId === bill.id);

  return (
    <DashboardLayout pageTitle="Bill Details">
      {/* Back & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigateTo('bills')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#1E293B] w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bills &amp; Expenses
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setContribOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <HandCoins className="w-4 h-4" />
            Add Contribution
          </button>
          <button
            type="button"
            onClick={() => setPaymentOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            Record Provider Payment
          </button>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-red-600 inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Bill Header Summary */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-[#1E293B]">{bill.title}</h2>
              <StatusBadge status={financials.paymentStatus} size="md" />
              <StatusBadge status={financials.fundingStatus} size="md" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {bill.provider}
              </span>
              <span>·</span>
              <span>Account: <strong className="text-[#1E293B] font-mono-tabular">{bill.accountNumber || '—'}</strong></span>
              <span>·</span>
              <span>Category: <strong className="text-[#1E293B]">{category?.name || 'General'}</strong></span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Calendar className="w-3.5 h-3.5" />
                Due {formatDateShort(bill.dueDate)}
              </span>
            </div>
          </div>

          <div className="text-left md:text-right shrink-0">
            <p className="text-xs font-semibold text-[#64748B]">Total Bill Obligation</p>
            <p className="text-2xl font-extrabold text-[#1E293B] tabular-nums">
              {formatPHP(bill.amount)}
            </p>
          </div>
        </div>
        {bill.notes && (
          <p className="text-xs text-[#64748B] pt-3 border-t border-slate-100">
            {bill.notes}
          </p>
        )}
      </div>

      {/* STRICT SEPARATION: Member Contribution Funding vs Actual Provider Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Member Contribution Pool */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1E293B]">
                1. Member Contribution Funding
              </h3>
              <p className="text-xs text-[#64748B]">
                Internal household transfers toward this bill (does not pay the provider)
              </p>
            </div>
            <span className="text-sm font-bold text-[#0E7490] tabular-nums">
              {financials.fundingProgressPct}% Funded
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00DCE5] rounded-full transition-all"
              style={{ width: `${financials.fundingProgressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <p className="text-[#64748B]">Confirmed Pool</p>
              <p className="font-bold text-emerald-700 tabular-nums mt-0.5">
                {formatPHP(financials.confirmedContributions)}
              </p>
            </div>
            <div>
              <p className="text-[#64748B]">Pending Review</p>
              <p className="font-bold text-amber-700 tabular-nums mt-0.5">
                {formatPHP(financials.pendingContributions)}
              </p>
            </div>
            <div>
              <p className="text-[#64748B]">Funding Still Needed</p>
              <p className="font-bold text-[#1E293B] tabular-nums mt-0.5">
                {formatPHP(financials.remainingFundingRequired)}
              </p>
            </div>
          </div>
        </div>

        {/* Card B: Actual Service Provider Payments */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1E293B]">
                2. Actual Provider Payments ({bill.provider})
              </h3>
              <p className="text-xs text-[#64748B]">
                External disbursements actually paid to settle the utility/merchant
              </p>
            </div>
            <span className="text-sm font-bold text-emerald-700 tabular-nums">
              {financials.paymentProgressPct}% Paid
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all"
              style={{ width: `${financials.paymentProgressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <p className="text-[#64748B]">Actual Paid</p>
              <p className="font-bold text-emerald-700 tabular-nums mt-0.5">
                {formatPHP(financials.actualPaid)}
              </p>
            </div>
            <div>
              <p className="text-[#64748B]">Remaining Balance</p>
              <p className="font-bold text-red-700 tabular-nums mt-0.5">
                {formatPHP(financials.remainingBillBalance)}
              </p>
            </div>
            <div>
              <p className="text-[#64748B]">Payment Records</p>
              <p className="font-bold text-[#1E293B] tabular-nums mt-0.5">
                {billPayments.length} settled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Members */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0E7490]" />
            <h3 className="text-sm font-bold text-[#1E293B]">Assigned Members</h3>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('assignments')}
            className="text-xs font-semibold text-[#0E7490] hover:underline"
          >
            Manage Assignments
          </button>
        </div>
        {billAssignments.length === 0 ? (
          <p className="text-xs text-[#64748B]">
            No specific member assignments. Any household member may contribute flexibly.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {billAssignments.map((asg) => {
              const mem = members.find((m) => m.id === asg.memberId);
              return (
                <div
                  key={asg.id}
                  className="p-3.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-[#1E293B]">{mem?.name}</p>
                    <p className="text-[11px] text-[#64748B] tabular-nums">
                      Deadline: {formatDateShort(asg.deadline)} · Target:{' '}
                      {asg.targetAmount > 0 ? formatPHP(asg.targetAmount) : 'Flexible'}
                    </p>
                  </div>
                  <StatusBadge status={asg.priority} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Contributions & Actual Payments Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Contributions */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1E293B]">
              Submitted Contributions ({billContribs.length})
            </h3>
            <button
              type="button"
              onClick={() => setContribOpen(true)}
              className="text-xs font-semibold text-[#0E7490] hover:underline"
            >
              + Submit
            </button>
          </div>
          {billContribs.length === 0 ? (
            <p className="p-6 text-xs text-[#64748B]">No member contributions submitted yet.</p>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {billContribs.map((c) => {
                const mem = members.find((m) => m.id === c.memberId);
                return (
                  <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigateTo('contribution-details', { contributionId: c.id })
                          }
                          className="text-xs font-bold text-[#1E293B] hover:text-[#0E7490]"
                        >
                          {mem?.name}
                        </button>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 tabular-nums">
                        {formatDateShort(c.contributionDate)} · {c.paymentChannel} · {c.referenceNo || 'No ref'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-[#1E293B] tabular-nums">
                        {formatPHP(c.amount)}
                      </span>
                      {isAdmin && c.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => verifyContribution(c.id)}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold"
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actual Provider Payments */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1E293B]">
              Actual Provider Payments ({billPayments.length})
            </h3>
            <button
              type="button"
              onClick={() => setPaymentOpen(true)}
              className="text-xs font-semibold text-[#0E7490] hover:underline"
            >
              + Record Payment
            </button>
          </div>
          {billPayments.length === 0 ? (
            <p className="p-6 text-xs text-[#64748B]">
              No disbursements have been paid to {bill.provider} yet.
            </p>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {billPayments.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#1E293B]">{p.method}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5 tabular-nums">
                      {formatDateShort(p.paymentDate)} · Ref: {p.receiptReference} · Paid by {p.paidBy}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 tabular-nums shrink-0">
                    {formatPHP(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BillFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        editingBill={bill}
      />
      <ContributionFormModal
        isOpen={contribOpen}
        onClose={() => setContribOpen(false)}
        defaultBillId={bill.id}
      />
      <PaymentFormModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        defaultBillId={bill.id}
      />
      <ConfirmationDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteBill(bill.id);
          setConfirmDelete(false);
          navigateTo('bills');
        }}
        title="Delete Household Bill"
        message={`Delete "${bill.title}"? This will also remove linked contributions and payment records.`}
        confirmLabel="Delete Bill"
      />
    </DashboardLayout>
  );
}

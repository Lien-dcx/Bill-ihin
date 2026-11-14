import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  ReceiptText,
  User,
  Calendar,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import FormInput from '../components/ui/FormInput';
import ContributionFormModal from '../components/modals/ContributionFormModal';
import { useApp } from '../context/useApp';
import { computeBillFinancials, formatPHP, formatDateShort } from '../utils/finance';

export default function ContributionDetailsPage() {
  const {
    contributions,
    selectedContributionId,
    members,
    bills,
    payments,
    isAdmin,
    verifyContribution,
    rejectContribution,
    deleteContribution,
    navigateTo,
  } = useApp();

  const contrib =
    contributions.find((c) => c.id === selectedContributionId) || contributions[0];

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  if (!contrib) {
    return (
      <DashboardLayout pageTitle="Contribution Details">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-[#64748B]">Contribution record not found.</p>
          <button
            type="button"
            onClick={() => navigateTo('contributions')}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] text-[#1E293B] text-sm font-bold"
          >
            Back to Contributions
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const member = members.find((m) => m.id === contrib.memberId);
  const bill = bills.find((b) => b.id === contrib.billId);
  const billFin = bill ? computeBillFinancials(bill, contributions, payments) : null;

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setRejectError('Please specify a reason for rejecting this contribution.');
      return;
    }
    rejectContribution(contrib.id, rejectReason);
    setRejectOpen(false);
    setRejectReason('');
    setRejectError('');
  };

  return (
    <DashboardLayout pageTitle="Contribution Details">
      {/* Top Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigateTo('contributions')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#1E293B] w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contributions
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && contrib.status === 'Pending' && (
            <>
              <button
                type="button"
                onClick={() => verifyContribution(contrib.id)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Contribution
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectOpen(true);
                  setRejectReason('');
                  setRejectError('');
                }}
                className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject Contribution
              </button>
            </>
          )}
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

      {/* Main Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-[#1E293B]">
                  {formatPHP(contrib.amount)}
                </h2>
                <StatusBadge status={contrib.status} size="md" />
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                Flexible member contribution toward household bill pool
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-[#64748B] tabular-nums">
              <p>Submitted Date</p>
              <p className="font-bold text-[#1E293B] mt-0.5">
                {formatDateShort(contrib.contributionDate)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1">
              <p className="text-[#64748B] font-semibold inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Contributing Member
              </p>
              <p className="text-sm font-bold text-[#1E293B]">{member?.name || 'Unknown'}</p>
              <p className="text-[#64748B]">{member?.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[#64748B] font-semibold inline-flex items-center gap-1">
                <ReceiptText className="w-3.5 h-3.5" /> Target Household Bill
              </p>
              {bill ? (
                <button
                  type="button"
                  onClick={() => navigateTo('bill-details', { billId: bill.id })}
                  className="text-sm font-bold text-[#0E7490] hover:underline text-left block"
                >
                  {bill.title}
                </button>
              ) : (
                <p className="text-sm font-bold text-[#1E293B]">Unknown Bill</p>
              )}
              <p className="text-[#64748B]">{bill?.provider}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[#64748B] font-semibold">Transfer Channel</p>
              <p className="text-sm font-semibold text-[#1E293B]">{contrib.paymentChannel}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[#64748B] font-semibold">Reference Number</p>
              <p className="text-sm font-mono-tabular font-semibold text-[#1E293B]">
                {contrib.referenceNo || 'Not provided'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-1.5">
            <p className="text-xs font-semibold text-[#64748B]">Member Notes</p>
            <p className="text-sm text-[#1E293B] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5">
              {contrib.notes || 'No notes provided with this submission.'}
            </p>
          </div>

          {contrib.status === 'Confirmed' && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <p className="font-bold">Verified &amp; Confirmed</p>
              <p>
                Confirmed by {contrib.reviewedBy || 'Administrator'} on{' '}
                {formatDateShort(contrib.reviewedAt)}. Note: Confirming a member contribution updates the household funding pool, not the external provider payment status.
              </p>
            </div>
          )}

          {contrib.status === 'Rejected' && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
              <p className="font-bold">
                Rejected by {contrib.reviewedBy || 'Administrator'} ({formatDateShort(contrib.reviewedAt)})
              </p>
              <p>{contrib.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Side Panel: Bill Funding vs Payment Snapshot */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5 h-fit">
          <div>
            <h3 className="text-base font-bold text-[#1E293B]">Linked Bill Funding Snapshot</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              How this contribution affects the bill’s internal funding vs provider payment
            </p>
          </div>

          {billFin && bill ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Bill Amount</span>
                  <span className="font-bold text-[#1E293B] tabular-nums">{formatPHP(billFin.billTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Confirmed Member Pool</span>
                  <span className="font-bold text-[#0E7490] tabular-nums">{formatPHP(billFin.confirmedContributions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Remaining Funding Needed</span>
                  <span className="font-bold text-[#1E293B] tabular-nums">{formatPHP(billFin.remainingFundingRequired)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Actual Paid to {bill.provider}</span>
                  <span className="font-bold text-emerald-700 tabular-nums">{formatPHP(billFin.actualPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Remaining Bill Balance</span>
                  <span className="font-bold text-red-700 tabular-nums">{formatPHP(billFin.remainingBillBalance)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#64748B] inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Due Date
                  </span>
                  <StatusBadge status={billFin.paymentStatus} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('bill-details', { billId: bill.id })}
                className="w-full py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-bold text-[#1E293B]"
              >
                Open Full Bill Reconciliation
              </button>
            </div>
          ) : (
            <p className="text-xs text-[#64748B]">Linked bill details unavailable.</p>
          )}
        </div>
      </div>

      <ContributionFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        editingContribution={contrib}
      />

      <ConfirmationDialog
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        title="Reject Contribution"
        message={`Reject ${member?.name}'s contribution of ${formatPHP(contrib.amount)}?`}
        confirmLabel="Reject Submission"
        variant="danger"
      >
        <FormInput
          label="Rejection Reason"
          name="detail-reject-reason"
          type="textarea"
          required
          rows={3}
          value={rejectReason}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (rejectError) setRejectError('');
          }}
          placeholder="Explain why this submission is being rejected..."
          error={rejectError}
        />
      </ConfirmationDialog>

      <ConfirmationDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteContribution(contrib.id);
          setConfirmDelete(false);
          navigateTo('contributions');
        }}
        title="Delete Contribution"
        message="Permanently delete this contribution record?"
        confirmLabel="Delete"
      />
    </DashboardLayout>
  );
}

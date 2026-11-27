import { useState } from 'react';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import { useApp } from '../../context/useApp';
import { computeBillFinancials, formatPHP } from '../../utils/finance';

export default function ContributionFormModal(props) {
  const { isOpen, editingContribution, defaultBillId = '' } = props;
  if (!isOpen) return null;
  return <ContributionFormContent key={`${editingContribution?.id ?? 'new'}:${defaultBillId}`} {...props} />;
}

function ContributionFormContent({
  isOpen,
  onClose,
  editingContribution = null,
  defaultBillId = '',
}) {
  const {
    members,
    bills,
    contributions,
    payments,
    currentUser,
    isAdmin,
    addContribution,
    updateContribution,
  } = useApp();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState(() => editingContribution ? {
    memberId: editingContribution.memberId || currentUser?.id || members[0]?.id || '',
    billId: editingContribution.billId || bills[0]?.id || '',
    amount: String(editingContribution.amount || ''),
    contributionDate: editingContribution.contributionDate || today,
    paymentChannel: editingContribution.paymentChannel || 'GCash',
    referenceNo: editingContribution.referenceNo || '',
    notes: editingContribution.notes || '',
  } : {
    memberId: currentUser?.id || members[0]?.id || '',
    billId: defaultBillId || bills[0]?.id || '',
    amount: '',
    contributionDate: today,
    paymentChannel: currentUser?.preferredChannel || 'GCash',
    referenceNo: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBill = bills.find((b) => b.id === form.billId);
  const billFin = selectedBill
    ? computeBillFinancials(selectedBill, contributions, payments)
    : null;

  const validate = () => {
    const next = {};
    if (!form.memberId) next.memberId = 'Select contributing member.';
    if (!form.billId) next.billId = 'Select target bill or expense.';
    if (!form.amount || Number(form.amount) <= 0) {
      next.amount = 'Enter a flexible contribution amount greater than ₱0.';
    }
    if (!form.contributionDate) next.contributionDate = 'Select contribution date.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const saved = editingContribution
      ? await updateContribution(editingContribution.id, form)
      : await addContribution(form);
    setIsSubmitting(false);
    if (saved) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingContribution ? 'Edit Member Contribution' : 'Submit Flexible Contribution'}
      subtitle="Members can contribute any flexible amount—not forced to split equally. Submissions enter Pending status until verified by an administrator."
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] whitespace-nowrap shrink-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="contribution-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-sm font-semibold text-[#1E293B] whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {editingContribution ? 'Update Submission' : 'Submit Contribution'}
          </button>
        </>
      }
    >
      <form id="contribution-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Contributing Member"
            name="contrib-member"
            type="select"
            required
            disabled={!isAdmin && !editingContribution}
            value={form.memberId}
            onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
            options={members.map((m) => ({ value: m.id, label: `${m.name} (${m.role})` }))}
            error={errors.memberId}
          />
          <FormInput
            label="Target Bill / Expense"
            name="contrib-bill"
            type="select"
            required
            value={form.billId}
            onChange={(e) => setForm((f) => ({ ...f, billId: e.target.value }))}
            options={bills.map((b) => ({
              value: b.id,
              label: `${b.title} (${formatPHP(b.amount)})`,
            }))}
            error={errors.billId}
          />
        </div>

        {billFin && (
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-[#64748B]">Bill Total</p>
              <p className="font-bold text-[#1E293B] tabular-nums mt-0.5">
                {formatPHP(billFin.billTotal)}
              </p>
            </div>
            <div>
              <p className="text-[#64748B]">Confirmed Pool</p>
              <p className="font-bold text-emerald-700 tabular-nums mt-0.5">
                {formatPHP(billFin.confirmedContributions)}
              </p>
            </div>
            <div>
              <p className="text-[#64748B]">Funding Needed</p>
              <p className="font-bold text-[#0E7490] tabular-nums mt-0.5">
                {formatPHP(billFin.remainingFundingRequired)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Contribution Amount (₱)"
            name="contrib-amount"
            type="number"
            step="0.01"
            min="1"
            required
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Enter any flexible amount (e.g., 1500)"
            hint="Partial or custom amounts are supported."
            error={errors.amount}
          />
          <FormInput
            label="Contribution Date"
            name="contrib-date"
            type="date"
            required
            value={form.contributionDate}
            onChange={(e) => setForm((f) => ({ ...f, contributionDate: e.target.value }))}
            error={errors.contributionDate}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Transfer Channel"
            name="contrib-channel"
            type="select"
            value={form.paymentChannel}
            onChange={(e) => setForm((f) => ({ ...f, paymentChannel: e.target.value }))}
            options={[
              { value: 'GCash', label: 'GCash' },
              { value: 'Maya', label: 'Maya' },
              { value: 'BPI Online', label: 'BPI Online' },
              { value: 'UnionBank', label: 'UnionBank' },
              { value: 'Cash Pool', label: 'Cash Pool' },
            ]}
          />
          <FormInput
            label="Transfer Reference No."
            name="contrib-ref"
            value={form.referenceNo}
            onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
            placeholder="e.g., GC-88419203"
          />
        </div>

        <FormInput
          label="Notes / Proof Details"
          name="contrib-notes"
          type="textarea"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Describe your transfer or partial share note for admin verification..."
        />
      </form>
    </Modal>
  );
}

import { useState } from 'react';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import { useApp } from '../../context/useApp';
import { computeBillFinancials, formatPHP } from '../../utils/finance';

export default function PaymentFormModal(props) {
  const { isOpen, editingPayment, defaultBillId = '' } = props;
  if (!isOpen) return null;
  return <PaymentFormContent key={`${editingPayment?.id ?? 'new'}:${defaultBillId}`} {...props} />;
}

function PaymentFormContent({
  isOpen,
  onClose,
  editingPayment = null,
  defaultBillId = '',
}) {
  const { bills, contributions, payments, currentUser, savePayment } = useApp();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState(() => editingPayment ? {
    id: editingPayment.id,
    billId: editingPayment.billId || bills[0]?.id || '',
    amount: String(editingPayment.amount || ''),
    paymentDate: editingPayment.paymentDate || today,
    method: editingPayment.method || 'BPI Online Bills Pay',
    receiptReference: editingPayment.receiptReference || '',
    paidBy: editingPayment.paidBy || currentUser?.name || '',
    notes: editingPayment.notes || '',
  } : {
    billId: defaultBillId || bills[0]?.id || '',
    amount: '',
    paymentDate: today,
    method: 'BPI Online Bills Pay',
    receiptReference: '',
    paidBy: currentUser?.name || '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBill = bills.find((b) => b.id === form.billId);
  const billFin = selectedBill
    ? computeBillFinancials(selectedBill, contributions, payments)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.billId) next.billId = 'Select a bill.';
    if (!form.amount || Number(form.amount) <= 0) next.amount = 'Enter a valid payment amount.';
    if (!form.paymentDate) next.paymentDate = 'Select payment date.';
    if (!form.receiptReference.trim()) next.receiptReference = 'Enter official receipt or transaction ID.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    const saved = await savePayment(form);
    setIsSubmitting(false);
    if (saved) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPayment ? 'Edit Provider Payment' : 'Record Actual Service Provider Payment'}
      subtitle="Records real disbursement paid to the utility/merchant. Kept distinct from member contributions."
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
            form="payment-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-sm font-semibold text-[#1E293B] whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {editingPayment ? 'Save Payment' : 'Record Payment'}
          </button>
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Bill Paid to Provider"
          name="pay-bill"
          type="select"
          required
          value={form.billId}
          onChange={(e) => setForm((f) => ({ ...f, billId: e.target.value }))}
          options={bills.map((b) => ({
            value: b.id,
            label: `${b.title} — ${b.provider}`,
          }))}
          error={errors.billId}
        />

        {billFin && (
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-[#64748B]">Confirmed Contribs</p>
              <p className="font-bold text-[#0E7490] tabular-nums mt-0.5">
                {formatPHP(billFin.confirmedContributions)}
              </p>
            </div>
            <div>
              <p className="text-[#64748B]">Already Paid</p>
              <p className="font-bold text-emerald-700 tabular-nums mt-0.5">
                {formatPHP(billFin.actualPaid)}
              </p>
            </div>
            <div>
              <p className="text-[#64748B]">Remaining Balance</p>
              <p className="font-bold text-red-700 tabular-nums mt-0.5">
                {formatPHP(billFin.remainingBillBalance)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Actual Amount Paid (₱)"
            name="pay-amount"
            type="number"
            step="0.01"
            min="1"
            required
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0.00"
            error={errors.amount}
          />
          <FormInput
            label="Payment Date"
            name="pay-date"
            type="date"
            required
            value={form.paymentDate}
            onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
            error={errors.paymentDate}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Payment Method"
            name="pay-method"
            type="select"
            value={form.method}
            onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
            options={[
              { value: 'BPI Online Bills Pay', label: 'BPI Online Bills Pay' },
              { value: 'BPI Auto-Debit', label: 'BPI Auto-Debit' },
              { value: 'GCash Bills Pay', label: 'GCash Bills Pay' },
              { value: 'Maya Bills Pay', label: 'Maya Bills Pay' },
              { value: 'BPI Debit Card', label: 'BPI Debit Card' },
              { value: 'Cash / Over-the-Counter', label: 'Cash / Over-the-Counter' },
            ]}
          />
          <FormInput
            label="Official Receipt / Ref No."
            name="pay-ref"
            required
            value={form.receiptReference}
            onChange={(e) => setForm((f) => ({ ...f, receiptReference: e.target.value }))}
            placeholder="e.g., OR-20261113-992"
            error={errors.receiptReference}
          />
        </div>

        <FormInput
          label="Notes"
          name="pay-notes"
          type="textarea"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Optional payment confirmation or cashier branch details..."
        />
      </form>
    </Modal>
  );
}

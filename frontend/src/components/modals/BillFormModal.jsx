import { useState } from 'react';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import { useApp } from '../../context/useApp';

export default function BillFormModal(props) {
  const { isOpen, editingBill } = props;
  if (!isOpen) return null;
  return <BillFormContent key={editingBill?.id ?? 'new'} {...props} />;
}

function BillFormContent({ isOpen, onClose, editingBill = null }) {
  const { categories, addBill, updateBill } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const currentBillingPeriod = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date());

  const [form, setForm] = useState(() => editingBill ? {
    title: editingBill.title || '',
    provider: editingBill.provider || '',
    accountNumber: editingBill.accountNumber || '',
    categoryId: editingBill.categoryId || categories[0]?.id || '',
    amount: String(editingBill.amount || ''),
    dueDate: editingBill.dueDate || today,
    billingPeriod: editingBill.billingPeriod || '',
    isRecurring: Boolean(editingBill.isRecurring),
    notes: editingBill.notes || '',
  } : {
    title: '',
    provider: '',
    accountNumber: '',
    categoryId: categories[0]?.id || '',
    amount: '',
    dueDate: today,
    billingPeriod: currentBillingPeriod,
    isRecurring: true,
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const categoryId = form.categoryId || categories[0]?.id || '';

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Bill title is required.';
    if (!form.provider.trim()) next.provider = 'Service provider or merchant is required.';
    if (!categoryId) next.categoryId = 'Select a category.';
    if (!form.amount || Number(form.amount) <= 0) next.amount = 'Enter a valid amount greater than ₱0.';
    if (!form.dueDate) next.dueDate = 'Select a due date.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const bill = { ...form, categoryId };
    const saved = editingBill
      ? await updateBill(editingBill.id, bill)
      : await addBill(bill);
    if (saved) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBill ? 'Edit Household Bill / Expense' : 'Add Household Bill / Expense'}
      subtitle="Bills define household financial obligations separate from member contributions and provider payments."
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
            form="bill-form"
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-sm font-semibold text-[#1E293B] whitespace-nowrap shrink-0"
          >
            {editingBill ? 'Save Changes' : 'Create Bill'}
          </button>
        </>
      }
    >
      <form id="bill-form" onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Bill or Expense Title"
          name="bill-title"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g., Meralco Electricity — Dec 2026"
          error={errors.title}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Service Provider / Merchant"
            name="bill-provider"
            required
            value={form.provider}
            onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
            placeholder="e.g., Meralco, Maynilad, Puregold"
            error={errors.provider}
          />
          <FormInput
            label="Account / Reference No."
            name="bill-account"
            value={form.accountNumber}
            onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
            placeholder="e.g., CAN-4092881722"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categories.length > 0 ? (
            <FormInput
              label="Category"
              name="bill-category"
              type="select"
              required
              value={categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              error={errors.categoryId}
            />
          ) : (
            <div className="space-y-1.5">
              <p className="block text-xs font-semibold text-[#1E293B]">
                Category <span className="text-red-600 ml-0.5">*</span>
              </p>
              <p className="text-xs text-[#64748B]">
                No categories yet. Add one from Categories in the sidebar before creating a bill.
              </p>
              {errors.categoryId && <p className="text-xs text-red-600 font-medium" role="alert">{errors.categoryId}</p>}
            </div>
          )}
          <FormInput
            label="Total Amount (₱)"
            name="bill-amount"
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
            label="Due Date"
            name="bill-due"
            type="date"
            required
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            error={errors.dueDate}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <FormInput
            label="Billing Period"
            name="bill-period"
            value={form.billingPeriod}
            onChange={(e) => setForm((f) => ({ ...f, billingPeriod: e.target.value }))}
            placeholder="e.g., Nov 01 – Nov 30, 2026"
          />
          <label className="flex items-center gap-2.5 pt-5 text-sm font-medium text-[#1E293B] cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
              className="w-4 h-4 rounded border-[#E2E8F0] text-[#00DCE5] focus:ring-[#00DCE5]"
            />
            <span>Recurring monthly household bill</span>
          </label>
        </div>

        <FormInput
          label="Notes"
          name="bill-notes"
          type="textarea"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Optional details about meter reading, split context, or schedule..."
        />
      </form>
    </Modal>
  );
}

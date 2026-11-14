import { useState } from 'react';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import { useApp } from '../../context/useApp';

export default function BudgetFormModal(props) {
  const { isOpen, editingBudget, defaultMonth = '' } = props;
  if (!isOpen) return null;
  return <BudgetFormContent key={`${editingBudget?.id ?? 'new'}:${defaultMonth}`} {...props} />;
}

function BudgetFormContent({ isOpen, onClose, editingBudget = null, defaultMonth = '' }) {
  const { categories, saveBudget, settings } = useApp();
  const selectedMonth = defaultMonth || new Date().toISOString().slice(0, 7);

  const [form, setForm] = useState(() => editingBudget ? {
    id: editingBudget.id,
    month: editingBudget.month || selectedMonth,
    categoryId: editingBudget.categoryId || categories[0]?.id || '',
    allocatedAmount: String(editingBudget.allocatedAmount || ''),
    alertThresholdPct: String(editingBudget.alertThresholdPct || settings.autoAlertBudgetPct || 85),
    notes: editingBudget.notes || '',
  } : {
    month: selectedMonth,
    categoryId: categories[0]?.id || '',
    allocatedAmount: '',
    alertThresholdPct: String(settings.autoAlertBudgetPct || 85),
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.categoryId) next.categoryId = 'Select a category.';
    if (!form.allocatedAmount || Number(form.allocatedAmount) <= 0) {
      next.allocatedAmount = 'Enter an allocated amount greater than ₱0.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    const saved = await saveBudget(form);
    setIsSubmitting(false);
    if (saved) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBudget ? 'Update Category Budget' : 'Allocate Monthly Budget'}
      subtitle="Plan category spending caps and alert thresholds for the household."
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
            form="budget-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-sm font-semibold text-[#1E293B] whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {editingBudget ? 'Save Budget' : 'Add Budget'}
          </button>
        </>
      }
    >
      <form id="budget-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Budget Month"
            name="budget-month"
            type="month"
            required
            value={form.month}
            onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
          />
          <FormInput
            label="Expense Category"
            name="budget-category"
            type="select"
            required
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            error={errors.categoryId}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Monthly Allocation (₱)"
            name="budget-amount"
            type="number"
            step="100"
            min="1"
            required
            value={form.allocatedAmount}
            onChange={(e) => setForm((f) => ({ ...f, allocatedAmount: e.target.value }))}
            placeholder="e.g., 12000"
            error={errors.allocatedAmount}
          />
          <FormInput
            label="Warning Alert Threshold (%)"
            name="budget-threshold"
            type="number"
            min="50"
            max="100"
            value={form.alertThresholdPct}
            onChange={(e) => setForm((f) => ({ ...f, alertThresholdPct: e.target.value }))}
            hint="Trigger a warning when spending hits this percentage."
          />
        </div>

        <FormInput
          label="Planning Notes"
          name="budget-notes"
          type="textarea"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Optional assumptions or seasonal notes..."
        />
      </form>
    </Modal>
  );
}

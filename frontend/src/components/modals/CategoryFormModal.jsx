import { useState } from 'react';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import { useApp } from '../../context/useApp';

const PRESET_COLORS = [
  { value: '#00DCE5', label: 'Cyan (#00DCE5)' },
  { value: '#0284C7', label: 'Sky Blue (#0284C7)' },
  { value: '#0D9488', label: 'Teal (#0D9488)' },
  { value: '#1E293B', label: 'Dark Slate (#1E293B)' },
  { value: '#16A34A', label: 'Emerald (#16A34A)' },
  { value: '#D97706', label: 'Amber (#D97706)' },
  { value: '#DC2626', label: 'Crimson (#DC2626)' },
  { value: '#64748B', label: 'Slate Gray (#64748B)' },
];

export default function CategoryFormModal(props) {
  const { isOpen, editingCategory } = props;
  if (!isOpen) return null;
  return <CategoryFormContent key={editingCategory?.id ?? 'new'} {...props} />;
}

function CategoryFormContent({ isOpen, onClose, editingCategory = null }) {
  const { saveCategory } = useApp();

  const [form, setForm] = useState(() => editingCategory ? {
    id: editingCategory.id,
    name: editingCategory.name || '',
    description: editingCategory.description || '',
    color: editingCategory.color || '#00DCE5',
    monthlyAllocation: String(editingCategory.monthlyAllocation || ''),
    isActive: editingCategory.isActive ?? true,
  } : {
    name: '',
    description: '',
    color: '#00DCE5',
    monthlyAllocation: '',
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Category name is required.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    const saved = await saveCategory(form);
    setIsSubmitting(false);
    if (saved) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? 'Edit Expense Category' : 'Add Expense Category'}
      subtitle="Organize household bills and budget plans under clear spending categories."
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
            form="category-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-sm font-semibold text-[#1E293B] whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {editingCategory ? 'Save Category' : 'Create Category'}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Category Name"
          name="cat-name"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g., Streaming & Subscriptions"
          error={errors.name}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Chart Accent Color"
            name="cat-color"
            type="select"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            options={PRESET_COLORS}
          />
          <FormInput
            label="Default Monthly Guideline (₱)"
            name="cat-alloc"
            type="number"
            step="100"
            min="0"
            value={form.monthlyAllocation}
            onChange={(e) => setForm((f) => ({ ...f, monthlyAllocation: e.target.value }))}
            placeholder="e.g., 3500"
          />
        </div>

        <FormInput
          label="Description"
          name="cat-desc"
          type="textarea"
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What bills or household expenses belong in this category?"
        />

        <label className="flex items-center gap-2.5 text-sm font-medium text-[#1E293B] cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-[#E2E8F0]"
          />
          <span>Category is active for new bills</span>
        </label>
      </form>
    </Modal>
  );
}

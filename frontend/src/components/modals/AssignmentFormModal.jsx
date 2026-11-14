import { useState } from 'react';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import { useApp } from '../../context/useApp';
import { formatPHP } from '../../utils/finance';

export default function AssignmentFormModal(props) {
  const { isOpen, editingAssignment } = props;
  if (!isOpen) return null;
  return <AssignmentFormContent key={editingAssignment?.id ?? 'new'} {...props} />;
}

function AssignmentFormContent({ isOpen, onClose, editingAssignment = null }) {
  const { bills, members, saveAssignment } = useApp();
  const activeMembers = members.filter((member) => member.status === 'Active');
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState(() => editingAssignment ? {
    id: editingAssignment.id,
    billId: editingAssignment.billId || bills[0]?.id || '',
    memberId: editingAssignment.memberId || activeMembers[0]?.id || '',
    targetAmount: editingAssignment.targetAmount ? String(editingAssignment.targetAmount) : '',
    deadline: editingAssignment.deadline || today,
    priority: editingAssignment.priority || 'Normal',
    notes: editingAssignment.notes || '',
  } : {
    billId: bills[0]?.id || '',
    memberId: activeMembers[1]?.id || activeMembers[0]?.id || '',
    targetAmount: '',
    deadline: today,
    priority: 'Normal',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.billId) next.billId = 'Select a household bill.';
    if (!form.memberId) next.memberId = 'Select an assigned member.';
    if (!form.deadline) next.deadline = 'Select a target deadline.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    const saved = await saveAssignment(form);
    setIsSubmitting(false);
    if (saved) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAssignment ? 'Edit Bill Assignment' : 'Assign Bill Responsibility'}
      subtitle="Assign responsibility to a household member with an optional target contribution and deadline."
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
            form="assignment-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-sm font-semibold text-[#1E293B] whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {editingAssignment ? 'Update Assignment' : 'Assign Bill'}
          </button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Household Bill"
          name="asg-bill"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Assign to Member"
            name="asg-member"
            type="select"
            required
            value={form.memberId}
            onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
            options={members.map((m) => ({ value: m.id, label: m.name }))}
            error={errors.memberId}
          />
          <FormInput
            label="Optional Contribution Target (₱)"
            name="asg-target"
            type="number"
            step="0.01"
            min="0"
            value={form.targetAmount}
            onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
            placeholder="Leave blank if flexible"
            hint="Optional suggested share—not strictly enforced."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Contribution Deadline"
            name="asg-deadline"
            type="date"
            required
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            error={errors.deadline}
          />
          <FormInput
            label="Priority"
            name="asg-priority"
            type="select"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Normal', label: 'Normal' },
              { value: 'High', label: 'High' },
              { value: 'Urgent', label: 'Urgent' },
            ]}
          />
        </div>

        <FormInput
          label="Assignment Instructions"
          name="asg-notes"
          type="textarea"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Explain why or how this bill is assigned..."
        />
      </form>
    </Modal>
  );
}

import { useState } from 'react';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import { useApp } from '../../context/useApp';

export default function MemberFormModal(props) {
  const { isOpen, editingMember } = props;
  if (!isOpen) return null;
  return <MemberFormContent key={editingMember?.id ?? 'new'} {...props} />;
}

function MemberFormContent({ isOpen, onClose, editingMember = null }) {
  const { saveMember } = useApp();

  const [form, setForm] = useState(() => editingMember ? {
    id: editingMember.id,
    name: editingMember.name || '',
    email: editingMember.email || '',
    password: '',
    phone: editingMember.phone || '',
    role: editingMember.role || 'Member',
    relationship: editingMember.relationship || '',
    preferredChannel: editingMember.preferredChannel || 'GCash',
    monthlyIncomeShareNote: editingMember.monthlyIncomeShareNote || '',
    status: editingMember.status || 'Active',
  } : {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Member',
    relationship: '',
    preferredChannel: 'GCash',
    monthlyIncomeShareNote: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!form.email.trim() || !form.email.includes('@')) next.email = 'Valid email is required.';
    if (!editingMember && (!form.password || form.password.length < 8)) {
      next.password = 'Set an initial password of at least 8 characters.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    const saved = await saveMember(form);
    setIsSubmitting(false);
    if (saved) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMember ? 'Edit Household Member' : 'Add Household Member'}
      subtitle="Configure member role, contact info, and flexible contribution preferences."
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
            form="member-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-sm font-semibold text-[#1E293B] whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {editingMember ? 'Save Member' : 'Add Member'}
          </button>
        </>
      }
    >
      <form id="member-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Full Name"
            name="mem-name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g., Gabriel Santos"
            error={errors.name}
          />
          <FormInput
            label="Email Address"
            name="mem-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="name@household.ph"
            error={errors.email}
          />
        </div>

        {!editingMember && (
          <FormInput
            label="Initial Account Password"
            name="mem-password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="At least 8 characters"
            error={errors.password}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput
            label="Phone Number"
            name="mem-phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+63 917 000 0000"
          />
          <FormInput
            label="Role"
            name="mem-role"
            type="select"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            options={[
              { value: 'Member', label: 'Member' },
              { value: 'Administrator', label: 'Administrator' },
            ]}
          />
          <FormInput
            label="Account Status"
            name="mem-status"
            type="select"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Relationship / Label"
            name="mem-rel"
            value={form.relationship}
            onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
            placeholder="e.g., Cousin / Housemate"
          />
          <FormInput
            label="Preferred Channel"
            name="mem-channel"
            value={form.preferredChannel}
            onChange={(e) => setForm((f) => ({ ...f, preferredChannel: e.target.value }))}
            placeholder="e.g., GCash / BPI Online"
          />
        </div>

        <FormInput
          label="Contribution Arrangement Note"
          name="mem-note"
          type="textarea"
          rows={2}
          value={form.monthlyIncomeShareNote}
          onChange={(e) => setForm((f) => ({ ...f, monthlyIncomeShareNote: e.target.value }))}
          placeholder="Optional note on how this member prefers to contribute..."
        />
      </form>
    </Modal>
  );
}

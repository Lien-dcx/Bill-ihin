import { useState } from 'react';
import { Save, ShieldCheck, KeyRound } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusBadge from '../components/ui/StatusBadge';
import FormInput from '../components/ui/FormInput';
import { useApp } from '../context/useApp';
import { computeMemberSummary, formatPHP, formatDateShort } from '../utils/finance';

export default function MyProfilePage() {
  const {
    currentUser,
    household,
    bills,
    contributions,
    assignments,
    payments,
    updateProfile,
    changePassword,
    addToast,
  } = useApp();

  const [form, setForm] = useState({
    name: currentUser.name || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    relationship: currentUser.relationship || '',
    preferredChannel: currentUser.preferredChannel || 'GCash',
    monthlyIncomeShareNote: currentUser.monthlyIncomeShareNote || '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const memberSummary = computeMemberSummary({
    memberId: currentUser.id,
    bills,
    contributions,
    assignments,
    payments,
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      addToast('Name and email are required.', 'error');
      return;
    }
    updateProfile(form);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.current || passwords.next.length < 8) {
      addToast('Enter your current password and a new password (min 8 chars).', 'error');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      addToast('New passwords do not match.', 'error');
      return;
    }
    const updated = await changePassword({
      currentPassword: passwords.current,
      newPassword: passwords.next,
    });
    if (updated) setPasswords({ current: '', next: '', confirm: '' });
  };

  return (
    <DashboardLayout pageTitle="My Profile">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Identity & Stats Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-extrabold shrink-0"
                style={{ backgroundColor: currentUser.avatarBg || '#0E7490' }}
              >
                {currentUser.avatarInitials}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#1E293B] truncate">
                  {currentUser.name}
                </h2>
                <p className="text-xs text-[#64748B] truncate">{household.name}</p>
                <div className="mt-1.5">
                  <StatusBadge status={currentUser.role} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Member Since</span>
                <span className="font-semibold text-[#1E293B] tabular-nums">
                  {formatDateShort(currentUser.joinedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Confirmed Contributions</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {formatPHP(memberSummary.confirmedTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Pending Verification</span>
                <span className="font-bold text-amber-700 tabular-nums">
                  {formatPHP(memberSummary.pendingTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Assigned Bills</span>
                <span className="font-bold text-[#1E293B] tabular-nums">
                  {memberSummary.myAssignments.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1E293B]">
              <ShieldCheck className="w-4 h-4 text-[#0E7490]" />
              <span>Account Permissions</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {currentUser.role === 'Administrator'
                ? 'As Household Administrator, you can verify or reject member contributions, record provider payments, allocate budgets, and manage members.'
                : 'As a Household Member, you can submit flexible contributions, track assigned bills, and inspect household budget progress.'}
            </p>
          </div>
        </div>

        {/* Right Edit Forms */}
        <div className="lg:col-span-8 space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5"
          >
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Personal Information</h2>
              <p className="text-xs text-[#64748B]">
                Keep your contact details and preferred contribution channel up to date
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Full Name"
                name="prof-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <FormInput
                label="Email Address"
                name="prof-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormInput
                label="Mobile Number"
                name="prof-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <FormInput
                label="Relationship / Role Label"
                name="prof-rel"
                value={form.relationship}
                onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
              />
              <FormInput
                label="Preferred Payment Channel"
                name="prof-channel"
                value={form.preferredChannel}
                onChange={(e) => setForm((f) => ({ ...f, preferredChannel: e.target.value }))}
              />
            </div>

            <FormInput
              label="Contribution Share Note"
              name="prof-note"
              type="textarea"
              rows={2}
              value={form.monthlyIncomeShareNote}
              onChange={(e) =>
                setForm((f) => ({ ...f, monthlyIncomeShareNote: e.target.value }))
              }
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Save Profile
              </button>
            </div>
          </form>

          <form
            onSubmit={handleChangePassword}
            className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#0E7490]" />
              <div>
                <h2 className="text-base font-bold text-[#1E293B]">Security &amp; Password</h2>
                <p className="text-xs text-[#64748B]">Update your account password</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormInput
                label="Current Password"
                name="pw-current"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              />
              <FormInput
                label="New Password"
                name="pw-new"
                type="password"
                value={passwords.next}
                onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              />
              <FormInput
                label="Confirm New Password"
                name="pw-confirm"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-sm font-semibold"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

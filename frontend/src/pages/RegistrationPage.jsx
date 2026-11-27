import { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/useApp';
import { BillihinLogo } from '../components/layout/Sidebar';
import FormInput from '../components/ui/FormInput';

export default function RegistrationPage() {
  const { registerAccount, navigateTo } = useApp();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mode: 'create',
    householdName: '',
    inviteCode: '',
    relationship: 'Household Head',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required.';
    if (!form.email.trim() || !form.email.includes('@')) next.email = 'Valid email is required.';
    if (!form.password || form.password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    if (form.mode === 'create' && !form.householdName.trim()) {
      next.householdName = 'Enter a name for your household.';
    }
    if (form.mode === 'join' && !form.inviteCode.trim()) {
      next.inviteCode = 'Enter the household invite code.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    await registerAccount({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      householdName: form.mode === 'create' ? form.householdName : '',
      inviteCode: form.mode === 'join' ? form.inviteCode : '',
      relationship: form.relationship,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Left Info Panel */}
      <div className="lg:w-[42%] bg-[#1E293B] text-white p-8 sm:p-12 flex flex-col justify-between gap-8">
        <div>
          <BillihinLogo />
          <h1 className="mt-10 text-3xl font-extrabold tracking-tight text-balance">
            Set up your shared household finance hub in minutes.
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Whether you are creating a new household workspace as an Administrator or joining an existing home as a Member, Bill-ihin keeps budgets, contributions, and bill settlements organized.
          </p>
        </div>

        <div className="space-y-3 text-sm text-slate-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#00DCE5] shrink-0" />
            <span>Flexible contributions with optional target shares</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#00DCE5] shrink-0" />
            <span>Clear separation between member funding and provider payments</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#00DCE5] shrink-0" />
            <span>Philippine Peso (₱) budget allocation and overdue alerts</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('login')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#00DCE5] hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </button>
      </div>

      {/* Right Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Create Account</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Register as a household administrator or join an existing household.
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, mode: 'create', relationship: 'Household Head' }))}
              className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors ${
                form.mode === 'create'
                  ? 'bg-[#00DCE5] text-[#1E293B]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Create New Household (Admin)
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, mode: 'join', relationship: 'Household Member' }))}
              className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors ${
                form.mode === 'join'
                  ? 'bg-[#00DCE5] text-[#1E293B]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Join Existing Household
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Full Name"
                name="reg-name"
                required
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Juan Dela Cruz"
                error={errors.fullName}
              />
              <FormInput
                label="Relationship / Role Label"
                name="reg-rel"
                value={form.relationship}
                onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                placeholder="e.g., Father, Sibling"
              />
            </div>

            <FormInput
              label="Email Address"
              name="reg-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="juan@household.ph"
              error={errors.email}
            />

            {form.mode === 'create' ? (
              <FormInput
                label="Household Name"
                name="reg-household"
                required
                value={form.householdName}
                onChange={(e) => setForm((f) => ({ ...f, householdName: e.target.value }))}
                placeholder="e.g., Santos-Reyes Residence"
                error={errors.householdName}
              />
            ) : (
              <FormInput
                label="Household Invite Code"
                name="reg-invite"
                required
                value={form.inviteCode}
                onChange={(e) => setForm((f) => ({ ...f, inviteCode: e.target.value }))}
                placeholder="e.g., BH-A1B2C3D4E5-2026"
                error={errors.inviteCode}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Password"
                name="reg-pass"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                error={errors.password}
              />
              <FormInput
                label="Confirm Password"
                name="reg-confirm"
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Re-enter password"
                error={errors.confirmPassword}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DCE5] disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account…' : form.mode === 'create' ? 'Create Household & Continue' : 'Join Household & Continue'}
            </button>
          </form>

          <p className="text-center text-xs text-[#64748B]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="font-bold text-[#0E7490] hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

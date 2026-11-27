import { useState } from 'react';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import FormInput from '../components/ui/FormInput';
import ParallaxGridBackground from '../components/ui/ParallaxGridBackground';
import { useApp } from '../context/useApp';

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Enter your name.';
    if (!form.email.trim() || !form.email.includes('@')) next.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 8) {
      next.password = 'Use at least 8 characters.';
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    if (form.mode === 'create' && !form.householdName.trim()) {
      next.householdName = 'Enter a household name.';
    }
    if (form.mode === 'join' && !form.inviteCode.trim()) {
      next.inviteCode = 'Enter the invite code.';
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
    <main className="relative isolate flex min-h-screen items-center justify-center bg-[#F5F7F3] p-4 sm:p-8">
      <ParallaxGridBackground />
      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-3xl border border-[#DDE5DE] bg-white/90 shadow-lg backdrop-blur-md md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <AuthBrandPanel
          title="A simpler way to manage home bills."
          description="Create a household or join yours to keep shared bills and due dates together."
        />

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-xl space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#24352F] sm:text-3xl">
                Create your account
              </h2>
              <p className="mt-2 text-base text-[#68776D]">
                Choose how you want to get started.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#DDE5DE] bg-[#F5F8F5] p-1.5">
              <button
                type="button"
                onClick={() => setForm((current) => ({
                  ...current,
                  mode: 'create',
                  relationship: 'Household Head',
                }))}
                aria-pressed={form.mode === 'create'}
                className={`min-h-12 rounded-xl px-3 py-2 text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] ${
                  form.mode === 'create'
                    ? 'bg-[#137C69] text-white shadow-sm'
                    : 'text-[#526258] hover:bg-white'
                }`}
              >
                Create household
              </button>
              <button
                type="button"
                onClick={() => setForm((current) => ({
                  ...current,
                  mode: 'join',
                  relationship: 'Household Member',
                }))}
                aria-pressed={form.mode === 'join'}
                className={`min-h-12 rounded-xl px-3 py-2 text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] ${
                  form.mode === 'join'
                    ? 'bg-[#137C69] text-white shadow-sm'
                    : 'text-[#526258] hover:bg-white'
                }`}
              >
                Join household
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Your name"
                name="reg-name"
                required
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Full name"
                error={errors.fullName}
              />
              <FormInput
                label="Email address"
                name="reg-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
                error={errors.email}
              />

              {form.mode === 'create' ? (
                <FormInput
                  label="Household name"
                  name="reg-household"
                  required
                  value={form.householdName}
                  onChange={(event) => setForm((current) => ({ ...current, householdName: event.target.value }))}
                  placeholder="For example, the Santos home"
                  error={errors.householdName}
                />
              ) : (
                <FormInput
                  label="Household invite code"
                  name="reg-invite"
                  required
                  value={form.inviteCode}
                  onChange={(event) => setForm((current) => ({ ...current, inviteCode: event.target.value }))}
                  placeholder="Enter the code from your household"
                  error={errors.inviteCode}
                />
              )}

              <FormInput
                label="Password"
                name="reg-pass"
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="At least 8 characters"
                error={errors.password}
              />
              <FormInput
                label="Confirm password"
                name="reg-confirm"
                type="password"
                required
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                placeholder="Enter your password again"
                error={errors.confirmPassword}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-13 w-full rounded-xl bg-[#137C69] px-5 py-3 text-base font-bold text-white transition-colors hover:bg-[#0F6658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137C69] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Please wait…'
                  : form.mode === 'create'
                    ? 'Create account'
                    : 'Join household'}
              </button>
            </form>

            <p className="text-base text-[#526258]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="font-bold text-[#0F766E] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"
              >
                Sign in
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

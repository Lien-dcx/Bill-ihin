import { useState } from 'react';
import { ShieldCheck, HandCoins, CreditCard, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/useApp';
import { BillihinLogo } from '../components/layout/Sidebar';
import FormInput from '../components/ui/FormInput';

export default function LoginPage() {
  const { loginWithEmail, navigateTo } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!email.trim() || !email.includes('@')) {
      next.email = 'Enter a valid email address.';
    }
    if (!password.trim()) {
      next.password = 'Enter your password.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setIsSubmitting(true);
    await loginWithEmail({ email, password });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Left Brand & Value Column */}
      <div className="lg:w-[46%] bg-[#1E293B] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between gap-10">
        <div>
          <BillihinLogo />
          <h1 className="mt-10 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-balance">
            Household budgeting built for real families, not forced 50/50 splits.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
            Plan monthly household budgets, accept flexible member contributions, verify transfers before settling bills, and track actual payments to utility providers.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-800/70 border border-slate-700/80">
            <HandCoins className="w-5 h-5 text-[#00DCE5] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-white">Flexible Member Contributions</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Members contribute custom or partial amounts toward shared bills based on capacity.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-800/70 border border-slate-700/80">
            <ShieldCheck className="w-5 h-5 text-[#00DCE5] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-white">Admin Verification Workflow</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Review proof notes, confirm valid transfers, or reject entries with clear reasons.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-800/70 border border-slate-700/80">
            <CreditCard className="w-5 h-5 text-[#00DCE5] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-white">Separate Contribution &amp; Provider Payment</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Never confuse member deposits with actual payments sent to Meralco, Maynilad, or banks.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Household finances, organized transparently.
        </p>
      </div>

      {/* Right Sign-In Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B] tracking-tight">
              Sign in to Bill-ihin
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Access your household budget, bill assignments, and verification queue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email Address"
              name="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@household.ph"
              error={errors.email}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-semibold text-[#1E293B]">
                  Password <span className="text-red-600">*</span>
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-[#1E293B] focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                      : 'border-[#E2E8F0] focus:border-[#00DCE5] focus:ring-[#00DCE5]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 font-medium">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DCE5] disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Signing in…' : 'Sign In'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Account access is based on the verified household role. */}
          <div className="pt-4 border-t border-[#E2E8F0] space-y-2.5">
            <p className="text-xs text-[#64748B] leading-relaxed">
              Your access is based on your household role. Create a household or join one with an invite code if you are new.
            </p>
          </div>

          <p className="text-center text-xs text-[#64748B]">
            New to Bill-ihin?{' '}
            <button
              type="button"
              onClick={() => navigateTo('register')}
              className="font-bold text-[#0E7490] hover:underline"
            >
              Create a household account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

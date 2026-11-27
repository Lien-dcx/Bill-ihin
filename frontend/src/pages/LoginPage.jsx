import { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/useApp';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import FormInput from '../components/ui/FormInput';
import ParallaxGridBackground from '../components/ui/ParallaxGridBackground';

export default function LoginPage() {
  const { loginWithEmail, navigateTo } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    <main className="relative isolate flex min-h-screen items-center justify-center bg-[#F5F7F3] p-4 sm:p-8">
      <ParallaxGridBackground />
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#DDE5DE] bg-white/90 shadow-lg backdrop-blur-md md:grid-cols-2">
        <AuthBrandPanel
          title="Home bills, made simple."
          description="See household bills, due dates, and contributions in one clear place."
        />

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-7">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#24352F] sm:text-3xl">
                Welcome back
              </h2>
              <p className="mt-2 text-base text-[#68776D]">
                Sign in to view your household.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <FormInput
                label="Email address"
                name="login-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                error={errors.email}
              />

              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-sm font-semibold text-[#24352F]">
                  Password <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    name="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                    className={`min-h-12 w-full rounded-xl border bg-white px-4 py-3 pr-14 text-base text-[#24352F] focus:outline-none focus:ring-2 ${
                      errors.password
                        ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                        : 'border-[#C9D4CC] focus:border-[#137C69] focus:ring-[#137C69]/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1 flex h-10 w-11 items-center justify-center rounded-lg text-[#526258] hover:bg-[#F0F5F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"
                  >
                    {showPassword
                      ? <EyeOff className="h-5 w-5" aria-hidden="true" />
                      : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="login-password-error" className="text-sm font-semibold text-red-700" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#137C69] px-5 py-3 text-base font-bold text-white transition-colors hover:bg-[#0F6658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#137C69] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
                {!isSubmitting && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
              </button>
            </form>

            <p className="text-base text-[#526258]">
              New to Bill-ihin?{' '}
              <button
                type="button"
                onClick={() => navigateTo('register')}
                className="font-bold text-[#0F766E] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"
              >
                Create an account
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

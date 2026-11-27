import { Droplets, Wifi, Zap } from 'lucide-react';
import { BillihinLogo } from '../layout/Sidebar';

export default function AuthBrandPanel({ title, description }) {
  return (
    <section className="auth-brand-panel flex flex-col justify-between gap-10 p-7 text-white sm:p-10">
      <BillihinLogo />
      <div>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-[#D3E2D9]">
          {description}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2" aria-label="Household utilities">
        <div className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-white/10 px-2 py-2">
          <Zap className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <span className="text-sm font-semibold">Power</span>
        </div>
        <div className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-white/10 px-2 py-2">
          <Droplets className="h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
          <span className="text-sm font-semibold">Water</span>
        </div>
        <div className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-white/10 px-2 py-2">
          <Wifi className="h-5 w-5 shrink-0 text-violet-300" aria-hidden="true" />
          <span className="text-sm font-semibold">Internet</span>
        </div>
      </div>
    </section>
  );
}

import { Loader2 } from 'lucide-react';

export default function LoadingIndicator({ rows = 4, label = 'Loading household data...' }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
        <Loader2 className="w-4 h-4 animate-spin text-[#0E7490]" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-3 items-center py-2 border-t border-slate-100">
            <div className="col-span-4 h-4 bg-slate-100 rounded animate-pulse" />
            <div className="col-span-3 h-4 bg-slate-100 rounded animate-pulse" />
            <div className="col-span-3 h-4 bg-slate-100 rounded animate-pulse" />
            <div className="col-span-2 h-4 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}


export default function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'default',
  trend,
  onClick,
  actionLabel,
}) {
  const toneStyles = {
    default: {
      iconBox: 'bg-[#F8FAFC] text-[#1E293B] border-[#E2E8F0]',
      valueText: 'text-[#1E293B]',
    },
    cyan: {
      iconBox: 'bg-[#E6FBFC] text-[#0E7490] border-[#00DCE5]/40',
      valueText: 'text-[#1E293B]',
    },
    green: {
      iconBox: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      valueText: 'text-emerald-700',
    },
    amber: {
      iconBox: 'bg-amber-50 text-amber-700 border-amber-200',
      valueText: 'text-amber-700',
    },
    red: {
      iconBox: 'bg-red-50 text-red-700 border-red-200',
      valueText: 'text-red-700',
    },
  };

  const style = toneStyles[tone] || toneStyles.default;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between gap-3 transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#64748B] tracking-tight leading-snug">
            {title}
          </p>
          <p className={`mt-1.5 text-2xl font-bold tracking-tight tabular-nums ${style.valueText}`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${style.iconBox}`}
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend || onClick) && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[#64748B] leading-snug">{subtitle || trend}</span>
          {onClick && actionLabel && (
            <button
              type="button"
              onClick={onClick}
              className="text-[#0E7490] hover:text-[#1E293B] font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DCE5] rounded"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

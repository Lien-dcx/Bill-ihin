import { formatPHP } from '../../utils/finance';

/**
 * Pure SVG Donut Chart for Expense Breakdown by Category
 */
export function ExpenseDonutChart({ items = [], totalLabel = 'Total Expenses', compact = false }) {
  const total = items.reduce((s, i) => s + Number(i.value || 0), 0);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  const positiveItems = items.filter((i) => i.value > 0);
  const segments = positiveItems.map((item, index) => {
      const pct = total > 0 ? item.value / total : 0;
      const strokeLength = pct * circumference;
      const precedingValue = positiveItems
        .slice(0, index)
        .reduce((sum, previous) => sum + Number(previous.value || 0), 0);
      const offset = total > 0 ? -(precedingValue / total) * circumference : 0;
      return {
        ...item,
        pct: Math.round(pct * 100),
        strokeDasharray: `${strokeLength} ${circumference}`,
        strokeDashoffset: offset,
      };
    });

  return (
    <div className={`flex flex-col ${compact ? '2xl:flex-row' : 'md:flex-row'} items-center gap-5`}>
      <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" role="img" aria-label={totalLabel}>
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="18"
          />
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
          <span className="text-[11px] font-medium text-[#64748B]">{totalLabel}</span>
          <span className="text-xs sm:text-sm font-bold text-[#1E293B] tabular-nums mt-0.5">
            {formatPHP(total)}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full min-w-0 space-y-2">
        {segments.length === 0 ? (
          <p className="text-xs text-[#64748B]">No expense data available for this period.</p>
        ) : (
          segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden="true"
                />
                <span className="font-medium text-[#1E293B] truncate">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 tabular-nums">
                <span className="text-[#64748B]">{seg.pct}%</span>
                <span className="font-semibold text-[#1E293B] text-right">
                  {formatPHP(seg.value)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Pure SVG Grouped Monthly Comparison Bar Chart (Budget vs Expenses vs Confirmed Contributions)
 */
export function MonthlyComparisonBarChart({ data = [] }) {
  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => [d.budget || 0, d.expenses || 0, d.contributions || 0])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
        <div className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#CBD5E1]" aria-hidden="true" />
          <span>Monthly Budget</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#1E293B]" aria-hidden="true" />
          <span>Total Expenses</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#00DCE5]" aria-hidden="true" />
          <span>Confirmed Contributions</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[520px] grid grid-cols-6 gap-4 items-end pt-4 pb-2 border-b border-[#E2E8F0]">
          {data.map((d) => {
            const hBudget = Math.max(6, Math.round(((d.budget || 0) / maxVal) * 140));
            const hExpense = Math.max(6, Math.round(((d.expenses || 0) / maxVal) * 140));
            const hContrib = Math.max(6, Math.round(((d.contributions || 0) / maxVal) * 140));
            return (
              <div key={d.month} className="flex flex-col items-center gap-2">
                <div className="flex items-end gap-1.5 h-36">
                  <div
                    className="w-4 rounded-t bg-[#CBD5E1] transition-all"
                    style={{ height: `${hBudget}px` }}
                    title={`Budget: ${formatPHP(d.budget)}`}
                  />
                  <div
                    className="w-4 rounded-t bg-[#1E293B] transition-all"
                    style={{ height: `${hExpense}px` }}
                    title={`Expenses: ${formatPHP(d.expenses)}`}
                  />
                  <div
                    className="w-4 rounded-t bg-[#00DCE5] transition-all"
                    style={{ height: `${hContrib}px` }}
                    title={`Contributions: ${formatPHP(d.contributions)}`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-[#1E293B] whitespace-nowrap">
                    {d.month}
                  </p>
                  <p className="text-[10px] text-[#64748B] tabular-nums">
                    {formatPHP(d.expenses).replace('.00', '')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Horizontal Progress Comparison Bars (Budget vs Actual or Member Contribution Breakdown)
 */
export function HorizontalBarList({ items = [], showPercentage = true }) {
  return (
    <div className="space-y-3.5">
      {items.map((item) => {
        const pct = Math.min(100, Math.max(0, Number(item.pct || 0)));
        const barColor =
          item.tone === 'red'
            ? 'bg-red-500'
            : item.tone === 'amber'
            ? 'bg-amber-500'
            : item.tone === 'green'
            ? 'bg-emerald-500'
            : 'bg-[#00DCE5]';

        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#1E293B] truncate">{item.label}</span>
              <span className="text-[#64748B] tabular-nums whitespace-nowrap shrink-0">
                <strong className="text-[#1E293B]">{item.primaryText}</strong>
                {item.secondaryText ? ` / ${item.secondaryText}` : ''}
                {showPercentage ? ` (${item.pct}%)` : ''}
              </span>
            </div>
            <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

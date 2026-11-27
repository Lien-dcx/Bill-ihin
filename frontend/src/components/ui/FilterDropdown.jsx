import { ChevronDown } from 'lucide-react';

export default function FilterDropdown({
  label,
  value,
  onChange,
  options = [],
  allLabel = 'All',
  className = '',
}) {
  const id = `filter-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-10 appearance-none bg-white border border-[#E2E8F0] rounded-lg pl-3 pr-8 text-sm font-medium text-[#1E293B] hover:border-slate-300 focus:outline-none focus:border-[#00DCE5] focus:ring-2 focus:ring-[#00DCE5]/20 transition-colors cursor-pointer"
      >
        <option value="all">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="w-4 h-4 text-[#64748B] absolute right-2.5 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

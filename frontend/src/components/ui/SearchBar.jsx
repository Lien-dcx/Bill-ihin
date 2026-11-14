import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search records...',
  ariaLabel = 'Search',
  className = '',
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className="w-4 h-4 text-[#64748B] absolute left-3 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full h-10 pl-9 pr-8 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:border-[#00DCE5] focus:ring-2 focus:ring-[#00DCE5]/20 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 p-1 text-slate-400 hover:text-[#1E293B] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DCE5]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

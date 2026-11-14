import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalItems,
  pageSize = 6,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#64748B] rounded-b-xl">
        <span className="tabular-nums">
          Showing {totalItems} {totalItems === 1 ? 'record' : 'records'}
        </span>
      </div>
    );
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, currentPage * pageSize);

  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    pages.push(i);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#64748B] rounded-b-xl">
      <span className="tabular-nums">
        Showing <strong className="text-[#1E293B]">{start}–{end}</strong> of{' '}
        <strong className="text-[#1E293B]">{totalItems}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="h-8 px-2.5 rounded-md border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 font-medium whitespace-nowrap shrink-0"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`w-8 h-8 rounded-md text-xs font-semibold tabular-nums transition-colors ${
              p === currentPage
                ? 'bg-[#00DCE5] text-[#1E293B] border border-[#00DCE5]'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="h-8 px-2.5 rounded-md border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 font-medium whitespace-nowrap shrink-0"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

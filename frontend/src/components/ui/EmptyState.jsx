import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'Try adjusting your search or filter criteria, or create a new entry.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-white border border-[#E2E8F0] rounded-xl">
      <div className="w-12 h-12 rounded-xl bg-[#E6FBFC] border border-[#00DCE5]/30 flex items-center justify-center text-[#0E7490] mb-4">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-[#1E293B]">{title}</h3>
      <p className="mt-1.5 text-sm text-[#64748B] max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DCE5]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

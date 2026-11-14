import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import EmptyState from './EmptyState';
import LoadingIndicator from './LoadingIndicator';
import Pagination from './Pagination';

export default function DataTable({
  columns = [],
  data = [],
  sortKey,
  sortDir = 'asc',
  onSort,
  onRowClick,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  isLoading = false,
  pagination,
  rowKey = 'id',
}) {
  if (isLoading) {
    return <LoadingIndicator rows={5} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || 'No matching records'}
        description={emptyDescription || 'No entries match your current filters.'}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const alignCls = col.align === 'right' ? 'text-right' : 'text-left';
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 text-xs font-semibold text-[#64748B] whitespace-nowrap ${alignCls} ${col.headerClassName || ''}`}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className={`inline-flex items-center gap-1 hover:text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DCE5] rounded ${
                          col.align === 'right' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <span>{col.label}</span>
                        {isSorted ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#0E7490]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#0E7490]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-sm">
            {data.map((row, idx) => (
              <tr
                key={row[rowKey] || idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[#F8FAFC]'
                    : 'hover:bg-[#F8FAFC]/60'
                }`}
              >
                {columns.map((col) => {
                  const alignCls = col.align === 'right' ? 'text-right tabular-nums' : 'text-left';
                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-[#1E293B] align-middle ${alignCls} ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}

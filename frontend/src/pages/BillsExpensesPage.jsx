import { useState, useMemo } from 'react';
import {
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  ReceiptText,
  AlertTriangle,
  CheckCircle2,
  HandCoins,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SummaryCard from '../components/ui/SummaryCard';
import SearchBar from '../components/ui/SearchBar';
import FilterDropdown from '../components/ui/FilterDropdown';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import BillFormModal from '../components/modals/BillFormModal';
import { useApp } from '../context/useApp';
import { computeHouseholdSummary, formatPHP, formatDateShort } from '../utils/finance';

export default function BillsExpensesPage() {
  const {
    bills,
    budgets,
    categories,
    contributions,
    payments,
    isLoading,
    simulateRefresh,
    deleteBill,
    navigateTo,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('dueDate');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [confirmDeleteBill, setConfirmDeleteBill] = useState(null);

  const summary = useMemo(
    () => computeHouseholdSummary({ bills, budgets, contributions, payments }),
    [bills, budgets, contributions, payments]
  );

  const filtered = useMemo(() => {
    return summary.enrichedBills
      .filter((b) => {
        const q = search.trim().toLowerCase();
        if (q) {
          const match =
            b.title.toLowerCase().includes(q) ||
            b.provider.toLowerCase().includes(q) ||
            (b.accountNumber || '').toLowerCase().includes(q);
          if (!match) return false;
        }
        if (categoryFilter !== 'all' && b.categoryId !== categoryFilter) return false;
        if (statusFilter !== 'all' && b.financials.paymentStatus !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let va = a[sortKey];
        let vb = b[sortKey];
        if (sortKey === 'amount') {
          va = Number(a.amount);
          vb = Number(b.amount);
        } else if (sortKey === 'remaining') {
          va = a.financials.remainingBillBalance;
          vb = b.financials.remainingBillBalance;
        }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [summary.enrichedBills, search, categoryFilter, statusFilter, sortKey, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const columns = [
    {
      key: 'title',
      label: 'Bill / Expense',
      sortable: true,
      render: (row) => {
        const cat = categories.find((c) => c.id === row.categoryId);
        return (
          <div className="min-w-[200px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigateTo('bill-details', { billId: row.id });
              }}
              className="font-semibold text-[#1E293B] hover:text-[#0E7490] text-left"
            >
              {row.title}
            </button>
            <p className="text-xs text-[#64748B]">
              {row.provider} · {cat?.name || 'Uncategorized'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums whitespace-nowrap text-xs">
          {formatDateShort(row.dueDate)}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Bill Total',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-[#1E293B]">{formatPHP(row.amount)}</span>
      ),
    },
    {
      key: 'confirmed',
      label: 'Confirmed Contribs',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <p className="font-semibold text-[#0E7490]">
            {formatPHP(row.financials.confirmedContributions)}
          </p>
          <p className="text-[11px] text-[#64748B]">
            {row.financials.fundingStatus}
          </p>
        </div>
      ),
    },
    {
      key: 'remaining',
      label: 'Paid / Balance',
      align: 'right',
      sortable: true,
      render: (row) => (
        <div className="text-right">
          <p className="font-semibold text-emerald-700">
            {formatPHP(row.financials.actualPaid)} paid
          </p>
          <p className="text-[11px] text-[#64748B]">
            Bal: {formatPHP(row.financials.remainingBillBalance)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Payment Status',
      render: (row) => <StatusBadge status={row.financials.paymentStatus} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigateTo('bill-details', { billId: row.id })}
            aria-label={`View details for ${row.title}`}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#0E7490] hover:bg-[#E6FBFC]"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingBill(row);
              setModalOpen(true);
            }}
            aria-label={`Edit ${row.title}`}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeleteBill(row)}
            aria-label={`Delete ${row.title}`}
            className="p-1.5 rounded-md text-[#64748B] hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout pageTitle="Bills & Expenses">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#64748B]">
          Manage all household utility bills and shared expenses. Member contributions and provider payments are tracked separately.
        </p>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={simulateRefresh}
            className="px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingBill(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Bill / Expense
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Billed Expenses"
          value={formatPHP(summary.totalExpenses)}
          subtitle={`${bills.length} household bills`}
          icon={ReceiptText}
        />
        <SummaryCard
          title="Confirmed Member Pool"
          value={formatPHP(summary.totalConfirmedContributions)}
          subtitle="Verified contributions toward bills"
          icon={HandCoins}
          tone="cyan"
        />
        <SummaryCard
          title="Actual Paid to Providers"
          value={formatPHP(summary.totalActualPaid)}
          subtitle="Confirmed disbursements to billers"
          icon={CheckCircle2}
          tone="green"
        />
        <SummaryCard
          title="Outstanding Bill Balance"
          value={formatPHP(summary.totalOutstandingAmount)}
          subtitle={`${summary.overdueCount} overdue bill requires attention`}
          icon={AlertTriangle}
          tone={summary.overdueCount > 0 ? 'red' : 'amber'}
        />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search bill title, provider, or account number..."
          className="md:w-80"
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <FilterDropdown
            label="Category Filter"
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
            allLabel="All Categories"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <FilterDropdown
            label="Payment Status Filter"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            allLabel="All Statuses"
            options={[
              { value: 'Paid', label: 'Paid' },
              { value: 'Partial Payment', label: 'Partial Payment' },
              { value: 'Unpaid', label: 'Unpaid' },
              { value: 'Overdue', label: 'Overdue' },
            ]}
          />
        </div>
      </div>

      {/* Bills Table */}
      <DataTable
        columns={columns}
        data={paginated}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onRowClick={(row) => navigateTo('bill-details', { billId: row.id })}
        isLoading={isLoading}
        emptyTitle="No matching bills found"
        emptyDescription="Clear your search filters or add a new household bill to get started."
        emptyActionLabel="Add Bill / Expense"
        onEmptyAction={() => {
          setEditingBill(null);
          setModalOpen(true);
        }}
        pagination={{
          currentPage: page,
          totalItems: filtered.length,
          pageSize,
          onPageChange: setPage,
        }}
      />

      <BillFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingBill={editingBill}
      />

      <ConfirmationDialog
        isOpen={Boolean(confirmDeleteBill)}
        onClose={() => setConfirmDeleteBill(null)}
        onConfirm={() => {
          if (confirmDeleteBill) {
            deleteBill(confirmDeleteBill.id);
            setConfirmDeleteBill(null);
          }
        }}
        title="Delete Household Bill"
        message={`Are you sure you want to delete "${confirmDeleteBill?.title}"? Related contributions, assignments, and payment logs for this bill will also be removed.`}
        confirmLabel="Delete Bill"
      />
    </DashboardLayout>
  );
}

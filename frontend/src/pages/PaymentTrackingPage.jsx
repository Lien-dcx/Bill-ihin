import { useState, useMemo } from 'react';
import {
  Plus,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Pencil,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SummaryCard from '../components/ui/SummaryCard';
import SearchBar from '../components/ui/SearchBar';
import FilterDropdown from '../components/ui/FilterDropdown';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import PaymentFormModal from '../components/modals/PaymentFormModal';
import { useApp } from '../context/useApp';
import { computeHouseholdSummary, formatPHP, formatDateShort } from '../utils/finance';

export default function PaymentTrackingPage() {
  const {
    bills,
    budgets,
    contributions,
    payments,
    deletePayment,
    navigateTo,
  } = useApp();

  const [search, setSearch] = useState('');
  const [billFilter, setBillFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [defaultBillId, setDefaultBillId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const summary = useMemo(
    () => computeHouseholdSummary({ bills, budgets, contributions, payments }),
    [bills, budgets, contributions, payments]
  );

  const enrichedPayments = useMemo(() => {
    return payments.map((p) => {
      const bill = bills.find((b) => b.id === p.billId);
      return {
        ...p,
        billTitle: bill?.title || 'Household Bill',
        provider: bill?.provider || 'Service Provider',
      };
    });
  }, [payments, bills]);

  const filteredPayments = useMemo(() => {
    return enrichedPayments.filter((p) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const hit =
          p.billTitle.toLowerCase().includes(q) ||
          p.provider.toLowerCase().includes(q) ||
          p.receiptReference.toLowerCase().includes(q) ||
          p.method.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (billFilter !== 'all' && p.billId !== billFilter) return false;
      return true;
    });
  }, [enrichedPayments, search, billFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, page]);

  const columns = [
    {
      key: 'billTitle',
      label: 'Bill & Service Provider',
      render: (row) => (
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateTo('bill-details', { billId: row.billId });
            }}
            className="font-bold text-[#1E293B] hover:text-[#0E7490] text-left"
          >
            {row.billTitle}
          </button>
          <p className="text-[11px] text-[#64748B]">{row.provider}</p>
        </div>
      ),
    },
    {
      key: 'paymentDate',
      label: 'Payment Date',
      render: (row) => (
        <span className="tabular-nums text-xs whitespace-nowrap">
          {formatDateShort(row.paymentDate)}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Channel & Receipt Ref',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-[#1E293B]">{row.method}</p>
          <p className="text-[11px] font-mono-tabular text-[#64748B]">{row.receiptReference}</p>
        </div>
      ),
    },
    {
      key: 'paidBy',
      label: 'Disbursed By',
      render: (row) => <span className="text-xs text-[#64748B]">{row.paidBy}</span>,
    },
    {
      key: 'amount',
      label: 'Actual Amount Paid',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-emerald-700">{formatPHP(row.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setEditingPayment(row);
              setDefaultBillId(row.billId);
              setModalOpen(true);
            }}
            aria-label={`Edit payment ${row.receiptReference}`}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(row)}
            aria-label={`Delete payment ${row.receiptReference}`}
            className="p-1.5 rounded-md text-[#64748B] hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout pageTitle="Payment Tracking">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#64748B]">
          Track actual payments disbursed to external service providers—kept strictly separate from internal member contribution deposits.
        </p>
        <button
          type="button"
          onClick={() => {
            setEditingPayment(null);
            setDefaultBillId('');
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Record Provider Payment
        </button>
      </div>

      {/* Explicit Separation KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Actual Paid to Providers"
          value={formatPHP(summary.totalActualPaid)}
          subtitle={`${payments.length} settled provider disbursements`}
          icon={CheckCircle2}
          tone="green"
        />
        <SummaryCard
          title="Remaining Bill Balance"
          value={formatPHP(summary.totalOutstandingAmount)}
          subtitle={`${summary.outstandingCount} bills still owe providers`}
          icon={AlertCircle}
          tone={summary.overdueCount > 0 ? 'red' : 'amber'}
        />
        <SummaryCard
          title="Confirmed Member Pool"
          value={formatPHP(summary.totalConfirmedContributions)}
          subtitle="Verified contributions available"
          icon={ShieldCheck}
          tone="cyan"
        />
        <SummaryCard
          title="Remaining Funding Needed"
          value={formatPHP(Math.max(0, summary.totalExpenses - summary.totalConfirmedContributions))}
          subtitle="Gap between billed total & confirmed pool"
          icon={CreditCard}
        />
      </div>

      {/* Reconciliation Matrix: Contributions vs Actual Provider Payments */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#1E293B]">
            Bill Funding vs Provider Payment Reconciliation
          </h2>
          <p className="text-xs text-[#64748B]">
            A bill with confirmed member contributions still remains Unpaid or Overdue until an actual payment is sent to the service provider.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                <th className="px-4 py-3">Bill</th>
                <th className="px-4 py-3 text-right">Total Billed</th>
                <th className="px-4 py-3 text-right">Confirmed Contribs</th>
                <th className="px-4 py-3 text-right">Funding Needed</th>
                <th className="px-4 py-3 text-right">Actual Paid</th>
                <th className="px-4 py-3 text-right">Bill Balance</th>
                <th className="px-4 py-3">Provider Status</th>
                <th className="px-4 py-3 text-right">Settle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {summary.enrichedBills
                .filter((b) => b.financials.remainingBillBalance > 0)
                .map((b) => (
                  <tr key={b.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => navigateTo('bill-details', { billId: b.id })}
                        className="font-bold text-[#1E293B] hover:text-[#0E7490] text-left"
                      >
                        {b.title}
                      </button>
                      <p className="text-[11px] text-[#64748B]">{b.provider}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatPHP(b.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0E7490] tabular-nums">
                      {formatPHP(b.financials.confirmedContributions)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#64748B]">
                      {formatPHP(b.financials.remainingFundingRequired)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700 tabular-nums">
                      {formatPHP(b.financials.actualPaid)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-700 tabular-nums">
                      {formatPHP(b.financials.remainingBillBalance)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.financials.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPayment(null);
                          setDefaultBillId(b.id);
                          setModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] font-bold whitespace-nowrap"
                      >
                        Pay Balance
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter & Payment Disbursement History */}
      <div className="space-y-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search receipt reference, provider, or method..."
            className="md:w-80"
          />
          <FilterDropdown
            label="Bill Filter"
            value={billFilter}
            onChange={(v) => {
              setBillFilter(v);
              setPage(1);
            }}
            allLabel="All Bills"
            options={bills.map((b) => ({ value: b.id, label: b.title }))}
          />
        </div>

        <DataTable
          columns={columns}
          data={paginated}
          emptyTitle="No payment disbursements recorded"
          emptyDescription="Record an official payment once funds are paid to a service provider."
          emptyActionLabel="Record Payment"
          onEmptyAction={() => {
            setEditingPayment(null);
            setDefaultBillId('');
            setModalOpen(true);
          }}
          pagination={{
            currentPage: page,
            totalItems: filteredPayments.length,
            pageSize,
            onPageChange: setPage,
          }}
        />
      </div>

      <PaymentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingPayment={editingPayment}
        defaultBillId={defaultBillId}
      />

      <ConfirmationDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deletePayment(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
        title="Delete Provider Payment"
        message={`Delete payment receipt "${confirmDelete?.receiptReference}" (${formatPHP(confirmDelete?.amount)})? The linked bill balance will reopen.`}
        confirmLabel="Delete Payment"
      />
    </DashboardLayout>
  );
}

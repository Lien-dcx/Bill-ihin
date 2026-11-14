import { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  Pencil,
  Trash2,
  ShieldCheck,
  Clock,
  HandCoins,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SummaryCard from '../components/ui/SummaryCard';
import SearchBar from '../components/ui/SearchBar';
import FilterDropdown from '../components/ui/FilterDropdown';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import FormInput from '../components/ui/FormInput';
import ContributionFormModal from '../components/modals/ContributionFormModal';
import { useApp } from '../context/useApp';
import { formatPHP, formatDateShort } from '../utils/finance';

export default function ContributionsPage() {
  const {
    contributions,
    members,
    bills,
    isAdmin,
    isLoading,
    verifyContribution,
    rejectContribution,
    deleteContribution,
    navigateTo,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [sortKey, setSortKey] = useState('contributionDate');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingContrib, setEditingContrib] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Reject dialog with required reason
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const enriched = useMemo(() => {
    return contributions.map((c) => {
      const member = members.find((m) => m.id === c.memberId);
      const bill = bills.find((b) => b.id === c.billId);
      return {
        ...c,
        memberName: member?.name || 'Unknown Member',
        billTitle: bill?.title || 'Unknown Bill',
      };
    });
  }, [contributions, members, bills]);

  const stats = useMemo(() => {
    const confirmed = contributions
      .filter((c) => c.status === 'Confirmed')
      .reduce((s, c) => s + Number(c.amount || 0), 0);
    const pending = contributions
      .filter((c) => c.status === 'Pending')
      .reduce((s, c) => s + Number(c.amount || 0), 0);
    const pendingCount = contributions.filter((c) => c.status === 'Pending').length;
    const rejectedCount = contributions.filter((c) => c.status === 'Rejected').length;
    return { confirmed, pending, pendingCount, rejectedCount };
  }, [contributions]);

  const filtered = useMemo(() => {
    return enriched
      .filter((c) => {
        const q = search.trim().toLowerCase();
        if (q) {
          const hit =
            c.memberName.toLowerCase().includes(q) ||
            c.billTitle.toLowerCase().includes(q) ||
            (c.referenceNo || '').toLowerCase().includes(q) ||
            (c.notes || '').toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (memberFilter !== 'all' && c.memberId !== memberFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let va = a[sortKey];
        let vb = b[sortKey];
        if (sortKey === 'amount') {
          va = Number(a.amount);
          vb = Number(b.amount);
        }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [enriched, search, statusFilter, memberFilter, sortKey, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectError('Please provide a clear reason so the member can resubmit.');
      return;
    }
    rejectContribution(rejectTarget.id, rejectReason);
    setRejectTarget(null);
    setRejectReason('');
    setRejectError('');
  };

  const columns = [
    {
      key: 'memberName',
      label: 'Member',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-[#1E293B]">{row.memberName}</p>
          <p className="text-[11px] text-[#64748B]">
            {row.paymentChannel} · {row.referenceNo || 'No ref'}
          </p>
        </div>
      ),
    },
    {
      key: 'billTitle',
      label: 'Target Bill / Expense',
      sortable: true,
      render: (row) => (
        <div className="max-w-[240px]">
          <p className="font-medium text-[#1E293B] truncate">{row.billTitle}</p>
          {row.notes && <p className="text-[11px] text-[#64748B] truncate">{row.notes}</p>}
        </div>
      ),
    },
    {
      key: 'contributionDate',
      label: 'Date',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-xs whitespace-nowrap">
          {formatDateShort(row.contributionDate)}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-[#1E293B]">{formatPHP(row.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Verification Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div
          className="inline-flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {isAdmin && row.status === 'Pending' && (
            <>
              <button
                type="button"
                onClick={() => verifyContribution(row.id)}
                title="Confirm contribution"
                aria-label={`Confirm contribution from ${row.memberName}`}
                className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap"
              >
                <CheckCircle2 className="w-3 h-3" />
                Confirm
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(row);
                  setRejectReason('');
                  setRejectError('');
                }}
                title="Reject contribution"
                aria-label={`Reject contribution from ${row.memberName}`}
                className="px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap"
              >
                <XCircle className="w-3 h-3" />
                Reject
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => navigateTo('contribution-details', { contributionId: row.id })}
            aria-label={`Inspect contribution ${row.id}`}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#0E7490] hover:bg-[#E6FBFC]"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingContrib(row);
              setFormModalOpen(true);
            }}
            aria-label={`Edit contribution ${row.id}`}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(row)}
            aria-label={`Delete contribution ${row.id}`}
            className="p-1.5 rounded-md text-[#64748B] hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout pageTitle="Flexible Member Contributions">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#64748B]">
          Members submit flexible partial or full amounts toward bills. Confirmed contributions build the household funding pool—separate from actual provider payments.
        </p>
        <button
          type="button"
          onClick={() => {
            setEditingContrib(null);
            setFormModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Submit Contribution
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Confirmed Contributions"
          value={formatPHP(stats.confirmed)}
          subtitle="Verified by household administrator"
          icon={ShieldCheck}
          tone="green"
        />
        <SummaryCard
          title="Pending Verification"
          value={formatPHP(stats.pending)}
          subtitle={`${stats.pendingCount} submissions awaiting review`}
          icon={Clock}
          tone="amber"
        />
        <SummaryCard
          title="Rejected Submissions"
          value={`${stats.rejectedCount} Returned`}
          subtitle="Requires member correction & resubmission"
          icon={XCircle}
          tone={stats.rejectedCount > 0 ? 'red' : 'default'}
        />
        <SummaryCard
          title="Total Logged Entries"
          value={`${contributions.length} Transfers`}
          subtitle="Flexible partial & full amounts"
          icon={HandCoins}
          tone="cyan"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search member, bill, reference, or note..."
          className="md:w-80"
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <FilterDropdown
            label="Member Filter"
            value={memberFilter}
            onChange={(v) => {
              setMemberFilter(v);
              setPage(1);
            }}
            allLabel="All Members"
            options={members.map((m) => ({ value: m.id, label: m.name }))}
          />
          <FilterDropdown
            label="Verification Status Filter"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            allLabel="All Verification Statuses"
            options={[
              { value: 'Pending', label: 'Pending' },
              { value: 'Confirmed', label: 'Confirmed' },
              { value: 'Rejected', label: 'Rejected' },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onRowClick={(row) => navigateTo('contribution-details', { contributionId: row.id })}
        isLoading={isLoading}
        emptyTitle="No contributions match your filter"
        emptyDescription="Submit a flexible contribution or clear your active filters."
        emptyActionLabel="Submit Contribution"
        onEmptyAction={() => {
          setEditingContrib(null);
          setFormModalOpen(true);
        }}
        pagination={{
          currentPage: page,
          totalItems: filtered.length,
          pageSize,
          onPageChange: setPage,
        }}
      />

      <ContributionFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        editingContribution={editingContrib}
      />

      {/* Reject Reason Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        title="Reject Contribution Submission"
        message={`Reject ${rejectTarget?.memberName}'s submission of ${formatPHP(rejectTarget?.amount)}? Provide a clear reason for the member.`}
        confirmLabel="Reject Contribution"
        variant="danger"
      >
        <FormInput
          label="Rejection Reason"
          name="reject-reason"
          type="textarea"
          required
          rows={3}
          value={rejectReason}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (rejectError) setRejectError('');
          }}
          placeholder="e.g., Reference number not found in GCash history or wrong recipient account..."
          error={rejectError}
        />
      </ConfirmationDialog>

      <ConfirmationDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteContribution(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
        title="Delete Contribution Record"
        message={`Delete this ${formatPHP(confirmDelete?.amount)} contribution record from ${confirmDelete?.memberName}?`}
        confirmLabel="Delete Record"
      />
    </DashboardLayout>
  );
}

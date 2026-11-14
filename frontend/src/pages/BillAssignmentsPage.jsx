import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ClipboardList, CalendarClock, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SummaryCard from '../components/ui/SummaryCard';
import SearchBar from '../components/ui/SearchBar';
import FilterDropdown from '../components/ui/FilterDropdown';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import AssignmentFormModal from '../components/modals/AssignmentFormModal';
import { useApp } from '../context/useApp';
import { formatPHP, formatDateShort } from '../utils/finance';

export default function BillAssignmentsPage() {
  const {
    assignments,
    bills,
    members,
    contributions,
    deleteAssignment,
    navigateTo,
  } = useApp();

  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsg, setEditingAsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const enriched = useMemo(() => {
    return assignments.map((a) => {
      const bill = bills.find((b) => b.id === a.billId);
      const member = members.find((m) => m.id === a.memberId);
      const confirmedTowardBill = contributions
        .filter((c) => c.billId === a.billId && c.memberId === a.memberId && c.status === 'Confirmed')
        .reduce((s, c) => s + Number(c.amount || 0), 0);
      const target = Number(a.targetAmount || 0);
      const fulfilled = target > 0 ? confirmedTowardBill >= target : confirmedTowardBill > 0;

      return {
        ...a,
        billTitle: bill?.title || 'Household Bill',
        billTotal: bill?.amount || 0,
        memberName: member?.name || 'Member',
        confirmedTowardBill,
        fulfilled,
      };
    });
  }, [assignments, bills, members, contributions]);

  const filtered = useMemo(() => {
    return enriched.filter((a) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const hit =
          a.billTitle.toLowerCase().includes(q) ||
          a.memberName.toLowerCase().includes(q) ||
          (a.notes || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (memberFilter !== 'all' && a.memberId !== memberFilter) return false;
      if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
      return true;
    });
  }, [enriched, search, memberFilter, priorityFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const fulfilledCount = enriched.filter((a) => a.fulfilled).length;
  const urgentCount = enriched.filter((a) => a.priority === 'Urgent' || a.priority === 'High').length;

  const columns = [
    {
      key: 'billTitle',
      label: 'Assigned Bill',
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
          {row.notes && <p className="text-[11px] text-[#64748B] truncate max-w-xs">{row.notes}</p>}
        </div>
      ),
    },
    {
      key: 'memberName',
      label: 'Assigned Member',
      render: (row) => <span className="font-semibold text-[#1E293B]">{row.memberName}</span>,
    },
    {
      key: 'targetAmount',
      label: 'Optional Target',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums">
          {row.targetAmount > 0 ? formatPHP(row.targetAmount) : 'Flexible'}
        </span>
      ),
    },
    {
      key: 'confirmedTowardBill',
      label: 'Confirmed Progress',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-emerald-700 tabular-nums">
          {formatPHP(row.confirmedTowardBill)}
        </span>
      ),
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (row) => (
        <span className="tabular-nums text-xs whitespace-nowrap">
          {formatDateShort(row.deadline)}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <StatusBadge status={row.priority} />,
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
              setEditingAsg(row);
              setModalOpen(true);
            }}
            aria-label={`Edit assignment for ${row.memberName}`}
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(row)}
            aria-label={`Delete assignment for ${row.memberName}`}
            className="p-1.5 rounded-md text-[#64748B] hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout pageTitle="Bill Assignments">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#64748B]">
          Assign household bills to specific members with optional contribution targets and clear deadlines.
        </p>
        <button
          type="button"
          onClick={() => {
            setEditingAsg(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Assign Bill
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Active Bill Assignments"
          value={`${assignments.length} Assigned`}
          subtitle="Delegated household responsibilities"
          icon={ClipboardList}
          tone="cyan"
        />
        <SummaryCard
          title="Targets Met / Funded"
          value={`${fulfilledCount} of ${assignments.length}`}
          subtitle="Confirmed member contributions met target"
          icon={CheckCircle2}
          tone="green"
        />
        <SummaryCard
          title="High / Urgent Deadlines"
          value={`${urgentCount} Priority`}
          subtitle="Requires prompt member attention"
          icon={CalendarClock}
          tone="amber"
        />
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search bill, member, or assignment note..."
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
            label="Priority Filter"
            value={priorityFilter}
            onChange={(v) => {
              setPriorityFilter(v);
              setPage(1);
            }}
            allLabel="All Priorities"
            options={[
              { value: 'Urgent', label: 'Urgent' },
              { value: 'High', label: 'High' },
              { value: 'Normal', label: 'Normal' },
              { value: 'Low', label: 'Low' },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        emptyTitle="No bill assignments found"
        emptyDescription="Assign a household bill to a member with an optional target and deadline."
        emptyActionLabel="Assign Bill"
        onEmptyAction={() => {
          setEditingAsg(null);
          setModalOpen(true);
        }}
        pagination={{
          currentPage: page,
          totalItems: filtered.length,
          pageSize,
          onPageChange: setPage,
        }}
      />

      <AssignmentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingAssignment={editingAsg}
      />

      <ConfirmationDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteAssignment(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
        title="Remove Bill Assignment"
        message={`Remove ${confirmDelete?.memberName}'s assignment for "${confirmDelete?.billTitle}"?`}
        confirmLabel="Remove Assignment"
      />
    </DashboardLayout>
  );
}

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Users, ShieldCheck, UserCheck } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SummaryCard from '../components/ui/SummaryCard';
import SearchBar from '../components/ui/SearchBar';
import FilterDropdown from '../components/ui/FilterDropdown';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import MemberFormModal from '../components/modals/MemberFormModal';
import { useApp } from '../context/useApp';
import { formatPHP } from '../utils/finance';

export default function HouseholdMembersPage() {
  const {
    members,
    contributions,
    assignments,
    currentUserId,
    deleteMember,
  } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const enriched = useMemo(() => {
    return members
      .map((m) => {
        const confirmed = contributions
          .filter((c) => c.memberId === m.id && c.status === 'Confirmed')
          .reduce((s, c) => s + Number(c.amount || 0), 0);
        const pending = contributions
          .filter((c) => c.memberId === m.id && c.status === 'Pending')
          .reduce((s, c) => s + Number(c.amount || 0), 0);
        const activeAssignments = assignments.filter((a) => a.memberId === m.id).length;
        return { ...m, confirmed, pending, activeAssignments };
      })
      .filter((m) => {
        const q = search.trim().toLowerCase();
        if (q) {
          const hit =
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            (m.relationship || '').toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (roleFilter !== 'all' && m.role !== roleFilter) return false;
        return true;
      });
  }, [members, contributions, assignments, search, roleFilter]);

  return (
    <DashboardLayout pageTitle="Household Members">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#64748B]">
          Manage household residents, administrator permissions, and flexible contribution preferences.
        </p>
        <button
          type="button"
          onClick={() => {
            setEditingMember(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Household Member
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Members"
          value={`${members.length} Members`}
          subtitle={`${members.filter((m) => m.status === 'Active').length} active accounts`}
          icon={Users}
          tone="cyan"
        />
        <SummaryCard
          title="Administrators"
          value={`${members.filter((m) => m.role === 'Administrator').length} Admin`}
          subtitle="Can verify contributions & manage budgets"
          icon={ShieldCheck}
          tone="green"
        />
        <SummaryCard
          title="Active Contributors"
          value={`${members.filter((m) => m.role === 'Member').length} Members`}
          subtitle="Flexible bill participation enabled"
          icon={UserCheck}
        />
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search member name, email, or relationship..."
          className="md:w-80"
        />
        <FilterDropdown
          label="Role Filter"
          value={roleFilter}
          onChange={setRoleFilter}
          allLabel="All Roles"
          options={[
            { value: 'Administrator', label: 'Administrator' },
            { value: 'Member', label: 'Member' },
          ]}
        />
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {enriched.map((m) => (
          <div
            key={m.id}
            className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: m.avatarBg || '#0E7490' }}
                >
                  {m.avatarInitials}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#1E293B] truncate">{m.name}</h3>
                  <p className="text-xs text-[#64748B] truncate">{m.relationship}</p>
                </div>
              </div>
              <StatusBadge status={m.role} />
            </div>

            <div className="space-y-1.5 text-xs text-[#64748B]">
              <p className="truncate">{m.email}</p>
              <p className="tabular-nums">{m.phone || '—'} · Preferred: {m.preferredChannel}</p>
              <p className="text-[#1E293B] font-medium">{m.monthlyIncomeShareNote}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
              <div>
                <p className="text-[#64748B]">Confirmed</p>
                <p className="font-bold text-emerald-700 tabular-nums">{formatPHP(m.confirmed)}</p>
              </div>
              <div>
                <p className="text-[#64748B]">Pending</p>
                <p className="font-bold text-amber-700 tabular-nums">{formatPHP(m.pending)}</p>
              </div>
              <div>
                <p className="text-[#64748B]">Assigned</p>
                <p className="font-bold text-[#1E293B] tabular-nums">{m.activeAssignments} bills</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <StatusBadge status={m.status} />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMember(m);
                    setModalOpen(true);
                  }}
                  aria-label={`Edit ${m.name}`}
                  className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                {m.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(m)}
                    aria-label={`Remove ${m.name}`}
                    className="p-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <MemberFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingMember={editingMember}
      />

      <ConfirmationDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteMember(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
        title="Remove Household Member"
        message={`Remove ${confirmDelete?.name} from ${'this household'}? Historical contributions will remain for audit clarity.`}
        confirmLabel="Remove Member"
      />
    </DashboardLayout>
  );
}

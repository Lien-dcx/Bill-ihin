import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Wallet, TrendingUp, PiggyBank } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SummaryCard from '../components/ui/SummaryCard';
import StatusBadge from '../components/ui/StatusBadge';
import SearchBar from '../components/ui/SearchBar';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import BudgetFormModal from '../components/modals/BudgetFormModal';
import { HorizontalBarList } from '../components/ui/Charts';
import { useApp } from '../context/useApp';
import { formatPHP } from '../utils/finance';

export default function BudgetManagementPage() {
  const { budgets, categories, bills, deleteBudget } = useApp();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const monthBudgets = budgets.filter((budget) => budget.month === selectedMonth);
  const monthBills = bills.filter((bill) => bill.dueDate?.startsWith(selectedMonth));

  const enrichedBudgets = useMemo(() => {
    return monthBudgets
      .map((bud) => {
        const category = categories.find((c) => c.id === bud.categoryId);
        const actualSpent = monthBills
          .filter((b) => b.categoryId === bud.categoryId)
          .reduce((s, b) => s + Number(b.amount || 0), 0);
        const remaining = Number(bud.allocatedAmount) - actualSpent;
        const pct =
          bud.allocatedAmount > 0
            ? Math.round((actualSpent / bud.allocatedAmount) * 100)
            : 0;
        let status = 'On Track';
        if (pct > 100) status = 'Over Budget';
        else if (pct >= (bud.alertThresholdPct || 85)) status = 'Near Limit';

        return {
          ...bud,
          categoryName: category?.name || 'Uncategorized',
          categoryColor: category?.color || '#00DCE5',
          actualSpent,
          remaining,
          pct,
          status,
        };
      })
      .filter((b) =>
        b.categoryName.toLowerCase().includes(search.trim().toLowerCase())
      );
  }, [monthBudgets, categories, monthBills, search]);

  const totalAllocated = enrichedBudgets.reduce((s, b) => s + Number(b.allocatedAmount || 0), 0);
  const totalSpent = enrichedBudgets.reduce((s, b) => s + b.actualSpent, 0);
  const totalRemaining = totalAllocated - totalSpent;

  return (
    <DashboardLayout pageTitle="Budget Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#64748B]">
          Allocate monthly spending caps by category and monitor real-time bill utilization.
        </p>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#64748B]" htmlFor="budget-month-filter">Month</label>
          <input
            id="budget-month-filter"
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] focus:outline-none focus:border-[#00DCE5] focus:ring-2 focus:ring-[#00DCE5]/20"
          />
          <button
            type="button"
            onClick={() => {
              setEditingBudget(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Allocate Category Budget
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title={`Total Planned Budget (${new Intl.DateTimeFormat('en-PH', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${selectedMonth}-01T00:00:00.000Z`))})`}
          value={formatPHP(totalAllocated)}
          subtitle={`${enrichedBudgets.length} category allocations`}
          icon={Wallet}
          tone="cyan"
        />
        <SummaryCard
          title="Actual Billed Spending"
          value={formatPHP(totalSpent)}
          subtitle={`${totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0}% of monthly plan`}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Remaining Household Budget"
          value={formatPHP(totalRemaining)}
          subtitle={totalRemaining < 0 ? 'Exceeds planned monthly cap' : 'Available within planned budget'}
          icon={PiggyBank}
          tone={totalRemaining < 0 ? 'red' : 'green'}
        />
      </div>

      {/* Visual Comparison */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">Budget vs Actual Spending by Category</h2>
            <p className="text-xs text-[#64748B]">
              Amber indicates category reached alert threshold; Red indicates over budget
            </p>
          </div>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Filter category..."
            className="sm:w-64"
          />
        </div>

        <HorizontalBarList
          items={enrichedBudgets.map((b) => ({
            label: b.categoryName,
            primaryText: formatPHP(b.actualSpent),
            secondaryText: formatPHP(b.allocatedAmount),
            pct: b.pct,
            tone: b.status === 'Over Budget' ? 'red' : b.status === 'Near Limit' ? 'amber' : 'cyan',
          }))}
        />
      </div>

      {/* Detailed Allocations Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3 text-right">Allocated</th>
                <th className="px-4 py-3 text-right">Actual Spent</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs">
              {enrichedBudgets.map((b) => (
                <tr key={b.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: b.categoryColor }}
                      />
                      <span className="font-bold text-[#1E293B]">{b.categoryName}</span>
                    </div>
                    {b.notes && <p className="text-[11px] text-[#64748B] mt-0.5">{b.notes}</p>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{b.month}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatPHP(b.allocatedAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatPHP(b.actualSpent)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold tabular-nums ${
                      b.remaining < 0 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatPHP(b.remaining)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBudget(b);
                          setModalOpen(true);
                        }}
                        aria-label={`Edit budget for ${b.categoryName}`}
                        className="p-1.5 rounded-md text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(b)}
                        aria-label={`Delete budget for ${b.categoryName}`}
                        className="p-1.5 rounded-md text-[#64748B] hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BudgetFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingBudget={editingBudget}
        defaultMonth={selectedMonth}
      />
      <ConfirmationDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteBudget(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
        title="Remove Budget Allocation"
        message={`Remove the monthly budget allocation for "${confirmDelete?.categoryName}"? Existing bills in this category will remain untouched.`}
        confirmLabel="Remove Budget"
      />
    </DashboardLayout>
  );
}

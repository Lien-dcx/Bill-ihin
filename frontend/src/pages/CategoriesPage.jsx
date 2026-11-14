import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import CategoryFormModal from '../components/modals/CategoryFormModal';
import { useApp } from '../context/useApp';
import { formatPHP } from '../utils/finance';

export default function CategoriesPage() {
  const { categories, bills, deleteCategory } = useApp();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const enriched = useMemo(() => {
    return categories
      .map((c) => {
        const catBills = bills.filter((b) => b.categoryId === c.id);
        const totalSpend = catBills.reduce((s, b) => s + Number(b.amount || 0), 0);
        return {
          ...c,
          billCount: catBills.length,
          totalSpend,
        };
      })
      .filter(
        (c) =>
          c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          (c.description || '').toLowerCase().includes(search.trim().toLowerCase())
      );
  }, [categories, bills, search]);

  return (
    <DashboardLayout pageTitle="Categories">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#64748B]">
          Organize household bills and monthly budget plans under standardized expense categories.
        </p>
        <button
          type="button"
          onClick={() => {
            setEditingCat(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search expense categories..."
          className="w-full sm:w-80"
        />
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B] tabular-nums">
          <Tags className="w-4 h-4 text-[#0E7490]" />
          <span>{categories.length} configured categories</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {enriched.map((cat) => (
          <div
            key={cat.id}
            className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-4 h-4 rounded shrink-0"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden="true"
                />
                <h3 className="text-sm font-bold text-[#1E293B] truncate">{cat.name}</h3>
              </div>
              <StatusBadge status={cat.isActive ? 'Active' : 'Inactive'} />
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              {cat.description || 'No description provided.'}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
              <div>
                <p className="text-[#64748B]">Guideline</p>
                <p className="font-bold text-[#1E293B] tabular-nums">
                  {formatPHP(cat.monthlyAllocation)}
                </p>
              </div>
              <div>
                <p className="text-[#64748B]">Current Spend</p>
                <p className="font-bold text-[#0E7490] tabular-nums">
                  {formatPHP(cat.totalSpend)}
                </p>
              </div>
              <div>
                <p className="text-[#64748B]">Bills</p>
                <p className="font-bold text-[#1E293B] tabular-nums">{cat.billCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setEditingCat(cat);
                  setModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-md border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(cat)}
                className="px-2.5 py-1.5 rounded-md border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingCategory={editingCat}
      />

      <ConfirmationDialog
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteCategory(confirmDelete.id);
            setConfirmDelete(null);
          }
        }}
        title="Delete Expense Category"
        message={`Delete category "${confirmDelete?.name}"? Categories with active bills must be reassigned first.`}
        confirmLabel="Delete Category"
      />
    </DashboardLayout>
  );
}

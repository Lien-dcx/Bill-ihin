import { useState } from 'react';
import { Plus } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import CategoryBillsPanel from '../components/dashboard/CategoryBillsPanel';
import BillFormModal from '../components/modals/BillFormModal';
import { useApp } from '../context/useApp';

export default function AdminDashboardPage() {
  const { bills, categories, contributions, payments, currentUser, navigateTo } = useApp();
  const [billModalOpen, setBillModalOpen] = useState(false);
  const pendingCount = contributions.filter((item) => item.status === 'Pending').length;

  return (
    <DashboardLayout pageTitle="Dashboard">
      <section className="flex flex-col gap-5 rounded-2xl border border-[#DDEBE4] bg-gradient-to-br from-[#F0F8F3] via-white to-[#E8F5F1] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="text-sm font-bold text-[#0F766E]">Household overview</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#24352F] sm:text-3xl">
            Hello, {currentUser.name}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-[#68776D]">
            Choose a category to see its next bill, due date, and history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBillModalOpen(true)}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#137C69] px-5 py-3 text-base font-bold text-white transition-colors hover:bg-[#0F6658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add a bill
        </button>
      </section>

      {pendingCount > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-base font-semibold text-[#62450D]">
            {pendingCount} {pendingCount === 1 ? 'contribution needs' : 'contributions need'} your review.
          </p>
          <button
            type="button"
            onClick={() => navigateTo('contributions')}
            className="min-h-11 rounded-xl border border-amber-300 bg-white px-4 py-2 text-base font-bold text-[#62450D] transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Review contributions
          </button>
        </section>
      )}

      <CategoryBillsPanel categories={categories} bills={bills} payments={payments} />

      <BillFormModal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
      />
    </DashboardLayout>
  );
}

import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import CategoryBillsPanel from '../components/dashboard/CategoryBillsPanel';
import ContributionFormModal from '../components/modals/ContributionFormModal';
import { useApp } from '../context/useApp';

export default function MemberDashboardPage() {
  const { currentUser, bills, categories, payments } = useApp();
  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState('');

  const startContribution = (bill) => {
    setSelectedBillId(bill.id);
    setContributionModalOpen(true);
  };

  return (
    <DashboardLayout pageTitle="Dashboard">
      <section className="rounded-2xl border border-[#DDEBE4] bg-gradient-to-br from-[#F0F8F3] via-white to-[#E8F5F1] p-5 sm:p-7">
        <p className="text-sm font-bold text-[#0F766E]">Household overview</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#24352F] sm:text-3xl">
          Hello, {currentUser.name}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-[#68776D]">
          Choose a category to see the next bill, due date, and bill history.
        </p>
      </section>

      <CategoryBillsPanel
        categories={categories}
        bills={bills}
        payments={payments}
        onContribute={startContribution}
      />

      <ContributionFormModal
        isOpen={contributionModalOpen}
        onClose={() => setContributionModalOpen(false)}
        defaultBillId={selectedBillId}
      />
    </DashboardLayout>
  );
}

import { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import FormInput from '../components/ui/FormInput';
import { useApp } from '../context/useApp';

export default function SettingsPage() {
  const { household, settings, updateHouseholdAndSettings, addToast } = useApp();

  const [hhForm, setHhForm] = useState({
    name: household.name || '',
    address: household.address || '',
    monthlyTargetBudget: String(household.monthlyTargetBudget || 85000),
    billingCycleDay: String(household.billingCycleDay || 1),
    inviteCode: household.inviteCode || '',
  });

  const [prefForm, setPrefForm] = useState({ ...settings });

  const handleRegenerateInvite = () => {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `BH-${suffix}-${new Date().getFullYear()}`;
    setHhForm((f) => ({ ...f, inviteCode: newCode }));
    addToast(`Generated new invite code: ${newCode}. Click Save Settings to apply.`, 'info');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!hhForm.name.trim()) {
      addToast('Household name is required.', 'error');
      return;
    }
    updateHouseholdAndSettings(
      {
        name: hhForm.name,
        address: hhForm.address,
        monthlyTargetBudget: Number(hhForm.monthlyTargetBudget || 0),
        billingCycleDay: Number(hhForm.billingCycleDay || 1),
        inviteCode: hhForm.inviteCode,
      },
      prefForm
    );
  };

  return (
    <DashboardLayout pageTitle="Settings">
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Household Configuration */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">Household Workspace Configuration</h2>
            <p className="text-xs text-[#64748B]">
              Customize your household identity, billing cycle start day, and member invite code
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Household Name"
              name="set-hh-name"
              required
              value={hhForm.name}
              onChange={(e) => setHhForm((f) => ({ ...f, name: e.target.value }))}
            />
            <FormInput
              label="Monthly Target Budget Baseline (₱)"
              name="set-hh-budget"
              type="number"
              min="1000"
              value={hhForm.monthlyTargetBudget}
              onChange={(e) => setHhForm((f) => ({ ...f, monthlyTargetBudget: e.target.value }))}
            />
          </div>

          <FormInput
            label="Residence Address"
            name="set-hh-address"
            value={hhForm.address}
            onChange={(e) => setHhForm((f) => ({ ...f, address: e.target.value }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <FormInput
              label="Monthly Billing Cycle Start Day"
              name="set-hh-cycle"
              type="number"
              min="1"
              max="28"
              value={hhForm.billingCycleDay}
              onChange={(e) => setHhForm((f) => ({ ...f, billingCycleDay: e.target.value }))}
            />
            <div className="flex items-end gap-2">
              <FormInput
                label="Member Invite Code"
                name="set-hh-invite"
                value={hhForm.inviteCode}
                onChange={(e) => setHhForm((f) => ({ ...f, inviteCode: e.target.value }))}
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleRegenerateInvite}
                className="h-[42px] px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 text-xs font-semibold text-[#1E293B] inline-flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          </div>
        </div>

        {/* Contribution & Verification Governance */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">
              Contribution &amp; Verification Rules
            </h2>
            <p className="text-xs text-[#64748B]">
              Configure flexible member contributions, verification evidence, and budget warning thresholds
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Default Budget Warning Threshold (%)"
              name="set-warn-pct"
              type="number"
              min="50"
              max="100"
              value={prefForm.autoAlertBudgetPct}
              onChange={(e) =>
                setPrefForm((p) => ({ ...p, autoAlertBudgetPct: Number(e.target.value) }))
              }
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 text-sm text-[#1E293B] cursor-pointer">
              <input
                type="checkbox"
                checked={prefForm.allowPartialContributions}
                onChange={(e) =>
                  setPrefForm((p) => ({ ...p, allowPartialContributions: e.target.checked }))
                }
                className="w-4 h-4 rounded border-[#E2E8F0]"
              />
              <span>
                Allow flexible partial member contributions (disable equal-split enforcement)
              </span>
            </label>

            <label className="flex items-center gap-3 text-sm text-[#1E293B] cursor-pointer">
              <input
                type="checkbox"
                checked={prefForm.requireContributionProofNote}
                onChange={(e) =>
                  setPrefForm((p) => ({
                    ...p,
                    requireContributionProofNote: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded border-[#E2E8F0]"
              />
              <span>Require transfer reference or notes on contribution submissions</span>
            </label>

            <label className="flex items-center gap-3 text-sm text-[#1E293B] cursor-pointer">
              <input
                type="checkbox"
                checked={prefForm.inAppAlerts}
                onChange={(e) =>
                  setPrefForm((p) => ({ ...p, inAppAlerts: e.target.checked }))
                }
                className="w-4 h-4 rounded border-[#E2E8F0]"
              />
              <span>Show in-app notifications for contribution submissions and verification decisions</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-sm font-bold inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save All Settings
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

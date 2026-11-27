import {
  LayoutDashboard,
  Home,
  Tags,
  ReceiptText,
  Wallet,
  HandCoins,
  ClipboardList,
  CreditCard,
  Users,
  BarChart3,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useApp } from '../../context/useApp';

export function BillihinLogo({ collapsed = false }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-[#14B8A6] text-[#17352F] flex items-center justify-center shrink-0 font-extrabold text-base tracking-tighter">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 3h16v18l-3-2-2.5 2-2.5-2-2.5 2-2.5-2-3 2V3z" />
          <path d="M8.5 9.5h7" />
          <path d="M8.5 13.5h5" />
        </svg>
      </div>
      {!collapsed && (
        <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
          Bill-ihin
        </span>
      )}
    </div>
  );
}

export default function Sidebar({
  open,
  onClose,
}) {
  const closeButtonRef = useRef(null);
  const {
    currentPage,
    navigateTo,
    isAdmin,
    contributions,
  } = useApp();

  const pendingContributions = contributions.filter((c) => c.status === 'Pending').length;

  const dashboardId = isAdmin ? 'dashboard' : 'member-dashboard';

  const navItems = [
    { id: dashboardId, label: 'Dashboard', icon: LayoutDashboard, match: ['dashboard', 'member-dashboard'] },
    { id: 'household-overview', label: 'Household Overview', icon: Home },
    { id: 'bills', label: 'Bills & Expenses', icon: ReceiptText, match: ['bills', 'bill-details'] },
    { id: 'budgets', label: 'Budget Management', icon: Wallet },
    {
      id: 'contributions',
      label: 'Contributions',
      icon: HandCoins,
      badge: pendingContributions > 0 ? pendingContributions : null,
      match: ['contributions', 'contribution-details'],
    },
    { id: 'assignments', label: 'Bill Assignments', icon: ClipboardList },
    { id: 'payments', label: 'Payment Tracking', icon: CreditCard },
    { id: 'members', label: 'Household Members', icon: Users },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];
  const visibleNavItems = isAdmin
    ? navItems
    : navItems.filter((item) => !['budgets', 'payments', 'members', 'categories', 'reports'].includes(item.id));

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  const isActive = (item) => {
    if (item.match) return item.match.includes(currentPage);
    return currentPage === item.id;
  };

  const handleNav = (id) => {
    navigateTo(id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50"
      aria-hidden={!open}
      style={{
        visibility: open ? 'visible' : 'hidden',
        transition: 'visibility 300ms linear',
        transitionDelay: open ? '0ms' : '300ms',
      }}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={onClose}
        aria-label="Close navigation menu"
        className={`absolute inset-0 h-full w-full bg-[#18251F]/55 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        id="main-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        inert={!open}
        className={`absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] flex-col bg-[#24352F] text-slate-100 shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
          <BillihinLogo />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72D6C1]"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <nav
          id="main-navigation-links"
          aria-label="Primary navigation"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl px-4 text-left text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72D6C1] ${
                  active
                    ? 'bg-[#D8F3E9] text-[#24352F]'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge && (
                  <span className={`rounded-full px-2.5 py-1 text-sm font-bold tabular-nums ${
                    active ? 'bg-[#24352F] text-white' : 'bg-white/15 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}

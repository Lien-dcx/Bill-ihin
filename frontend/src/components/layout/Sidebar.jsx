import {
  LayoutDashboard,
  Home,
  ReceiptText,
  Wallet,
  HandCoins,
  ClipboardList,
  CreditCard,
  Users,
  Tags,
  BarChart3,
  Bell,
  Settings,
  UserCircle,
  LogOut,
  X,
} from 'lucide-react';
import { useApp } from '../../context/useApp';

export function BillihinLogo({ collapsed = false }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-[#00DCE5] text-[#1E293B] flex items-center justify-center shrink-0 font-extrabold text-base tracking-tighter">
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
  collapsed,
  mobileOpen,
  onCloseMobile,
}) {
  const {
    currentPage,
    navigateTo,
    isAdmin,
    notifications,
    contributions,
    logout,
  } = useApp();

  const unreadNotifications = notifications.filter((n) => !n.read).length;
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
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : null,
    },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
  ];
  const visibleNavItems = isAdmin
    ? navItems
    : navItems.filter((item) => !['budgets', 'payments', 'members', 'categories', 'reports', 'settings'].includes(item.id));

  const isActive = (item) => {
    if (item.match) return item.match.includes(currentPage);
    return currentPage === item.id;
  };

  const handleNav = (id) => {
    navigateTo(id);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarBody = (isMobileDrawer = false) => {
    const isMini = collapsed && !isMobileDrawer;
    return (
      <div className="flex flex-col h-full bg-[#1E293B] text-slate-200 select-none">
        {/* Logo Row */}
        <div
          className={`h-16 flex items-center border-b border-slate-700/70 px-4 shrink-0 ${
            isMini ? 'justify-center' : 'justify-between'
          }`}
        >
          <BillihinLogo collapsed={isMini} />
          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          aria-label="Primary Sidebar Navigation"
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        >
            {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                title={isMini ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#00DCE5] text-[#1E293B] font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                } ${isMini ? 'justify-center px-2' : 'justify-between'}`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {!isMini && <span className="truncate">{item.label}</span>}
                </span>
                {!isMini && item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[11px] font-bold rounded tabular-nums ${
                      active
                        ? 'bg-[#1E293B] text-[#00DCE5]'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-700/70 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              logout();
            }}
            title={isMini ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-red-300 hover:bg-slate-800 transition-colors whitespace-nowrap ${
              isMini ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            {!isMini && <span>Logout</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-slate-800 transition-all duration-200 ${
          collapsed ? 'w-[74px]' : 'w-[256px]'
        }`}
      >
        {sidebarBody(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[82vw] h-full z-10 shadow-2xl">
            {sidebarBody(true)}
          </aside>
        </div>
      )}
    </>
  );
}

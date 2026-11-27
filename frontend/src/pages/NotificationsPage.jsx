import { useState, useMemo } from 'react';
import {
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  BellOff,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import FilterDropdown from '../components/ui/FilterDropdown';
import EmptyState from '../components/ui/EmptyState';
import { useApp } from '../context/useApp';

export default function NotificationsPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    navigateTo,
  } = useApp();

  const [readFilter, setReadFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (readFilter === 'unread' && n.read) return false;
      if (readFilter === 'read' && !n.read) return false;
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
      return true;
    });
  }, [notifications, readFilter, categoryFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const iconForType = (type) => {
    if (type === 'danger') return <XCircle className="w-5 h-5 text-red-600 shrink-0" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
    if (type === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
    return <Info className="w-5 h-5 text-[#0E7490] shrink-0" />;
  };

  return (
    <DashboardLayout pageTitle="Notifications">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#64748B]">
          Alerts for pending contribution verifications, overdue utility bills, budget thresholds, and settlements.
        </p>
        <button
          type="button"
          onClick={markAllNotificationsRead}
          disabled={unreadCount === 0}
          className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 text-xs font-bold text-[#1E293B] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <CheckCheck className="w-4 h-4 text-[#0E7490]" />
          Mark All as Read ({unreadCount})
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'read', label: 'Read' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReadFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                readFilter === tab.id
                  ? 'bg-white text-[#1E293B] border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <FilterDropdown
          label="Category Filter"
          value={categoryFilter}
          onChange={setCategoryFilter}
          allLabel="All Alert Types"
          options={[
            { value: 'Verification', label: 'Verification' },
            { value: 'Overdue Bill', label: 'Overdue Bill' },
            { value: 'Budget Alert', label: 'Budget Alert' },
            { value: 'Payment', label: 'Payment' },
            { value: 'Rejection', label: 'Rejection' },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications in this view"
          description="You are caught up on household bill alerts and contribution verifications."
        />
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] overflow-hidden">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                !n.read ? 'bg-[#E6FBFC]/35' : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="mt-0.5">{iconForType(n.type)}</div>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1E293B]">{n.title}</h3>
                    {!n.read && (
                      <span className="text-[11px] font-bold text-[#0E7490]">Unread</span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-slate-400 tabular-nums">
                    {n.category} · {n.createdAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.targetPage && (
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      navigateTo(n.targetPage);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B] text-xs font-bold whitespace-nowrap"
                  >
                    Open
                  </button>
                )}
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(n.id)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#1E293B] whitespace-nowrap"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteNotification(n.id)}
                  aria-label="Delete notification"
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

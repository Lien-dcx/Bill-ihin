import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../../context/useApp';

export default function NotificationDropdown() {
  const { notifications, markNotificationRead, markAllNotificationsRead, navigateTo } = useApp();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const iconForType = (type) => {
    if (type === 'danger') return <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
    if (type === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
    return <Info className="w-4 h-4 text-[#0E7490] shrink-0 mt-0.5" />;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        className="relative w-10 h-10 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] flex items-center justify-center text-[#1E293B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DCE5]"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B]">Notifications</h3>
              <p className="text-[11px] text-[#64748B] tabular-nums">
                {unreadCount} unread alerts
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E7490] hover:text-[#1E293B] whitespace-nowrap shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]">
            {notifications.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  markNotificationRead(item.id);
                  setOpen(false);
                  if (item.targetPage) navigateTo(item.targetPage);
                }}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[#F8FAFC] ${
                  !item.read ? 'bg-[#E6FBFC]/40' : 'bg-white'
                }`}
              >
                {iconForType(item.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#1E293B] truncate">
                      {item.title}
                    </p>
                    {!item.read && (
                      <span className="text-[10px] font-semibold text-[#0E7490] shrink-0">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#64748B] line-clamp-2">
                    {item.message}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400 tabular-nums">
                    {item.createdAt}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="px-4 py-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] text-center">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigateTo('notifications');
              }}
              className="text-xs font-semibold text-[#0E7490] hover:text-[#1E293B]"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

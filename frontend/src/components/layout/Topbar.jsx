import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronDown,
  UserCircle,
  Settings,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/useApp';
import NotificationDropdown from '../ui/NotificationDropdown';

export default function Topbar({
  pageTitle,
  onOpenNavigation,
  navigationOpen,
}) {
  const {
    household,
    currentUser,
    isAdmin,
    navigateTo,
    logout,
  } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[76px] shrink-0 items-center justify-between gap-4 border-b border-[#DDE5DE] bg-[#F8FAF6]/95 px-4 backdrop-blur sm:px-6">
      {/* Left: Sidebar Toggle & Page Title + Household Name */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="open-navigation"
          type="button"
          onClick={onOpenNavigation}
          aria-label="Open navigation menu"
          aria-controls="main-navigation"
          aria-expanded={navigationOpen}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#DDE5DE] bg-white text-[#24352F] transition-colors hover:bg-[#EAF4EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-[#24352F] sm:text-xl">
            {pageTitle}
          </h1>
          <p className="truncate text-sm text-[#68776D]">
            {household.name}
          </p>
        </div>
      </div>

      {/* Right: Notification Bell & User Profile Dropdown */}
      <div className="flex items-center gap-3 shrink-0">
        <NotificationDropdown />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-expanded={dropdownOpen}
            aria-label="Account menu"
            className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DCE5]"
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: currentUser.avatarBg || '#0E7490' }}
            >
              {currentUser.avatarInitials}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-bold text-[#1E293B] leading-tight truncate max-w-[130px]">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-[#64748B] leading-tight truncate">
                {currentUser.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1.5 z-40">
              <div className="px-4 py-2.5 border-b border-[#E2E8F0]">
                <p className="text-xs font-bold text-[#1E293B] truncate">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-[#64748B] truncate">
                  {currentUser.email}
                </p>
                <p className="text-[11px] font-semibold text-[#0E7490] mt-0.5">
                  {currentUser.role} · {household.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  navigateTo('profile');
                }}
                className="w-full px-4 py-2 text-left text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2.5"
              >
                <UserCircle className="w-4 h-4 text-[#64748B]" />
                <span>My Profile</span>
              </button>

              {isAdmin && <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  navigateTo('settings');
                }}
                className="w-full px-4 py-2 text-left text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2.5"
              >
                <Settings className="w-4 h-4 text-[#64748B]" />
                <span>Settings</span>
              </button>}

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 border-t border-slate-100 mt-1 pt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

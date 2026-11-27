import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ParallaxGridBackground from '../ui/ParallaxGridBackground';

export default function DashboardLayout({ pageTitle, children }) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [navigationRendered, setNavigationRendered] = useState(false);
  const closeTimer = useRef(null);

  const openNavigation = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setNavigationRendered(true);
    window.requestAnimationFrame(() => setNavigationOpen(true));
  }, []);

  const closeNavigation = useCallback(() => {
    setNavigationOpen(false);
    closeTimer.current = window.setTimeout(() => {
      setNavigationRendered(false);
      document.getElementById('open-navigation')?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    if (!navigationOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeNavigation();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [navigationOpen, closeNavigation]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <div className="dashboard-shell min-h-screen flex text-[#1E293B]">
      <ParallaxGridBackground />
      {navigationRendered && (
        <Sidebar open={navigationOpen} onClose={closeNavigation} />
      )}

      <div
        className="relative z-10 flex min-w-0 flex-1 flex-col"
        aria-hidden={navigationOpen}
        inert={navigationOpen}
      >
        <Topbar
          pageTitle={pageTitle}
          onOpenNavigation={openNavigation}
          navigationOpen={navigationOpen}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import { Sidebar } from '@/components/nav/Sidebar';
import { MobileHeader } from '@/components/nav/MobileHeader';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { DesktopHeader } from '@/components/nav/DesktopHeader';

/**
 * Shell layout wrapping all /assignments/* routes.
 * Splits layout into Mobile Shell (< 1024px) and Desktop Shell (>= 1024px) using clean parent-child flex layouts.
 * Eliminates all fixed/absolute margins, giving the page content precisely the net remaining space.
 */
export default function AssignmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg-mobile lg:bg-gradient-to-b lg:from-bg-desktop-start lg:to-bg-desktop-end font-sans">
      {/* MOBILE SHELL */}
      <div className="lg:hidden flex flex-col min-h-dvh">
        <MobileHeader />
        <main className="flex-1 px-4 py-4 pb-24 min-w-0 flex flex-col">
          {children}
        </main>
        <BottomTabBar />
      </div>

      {/* DESKTOP SHELL */}
      <div className="hidden lg:flex h-dvh w-full p-3 gap-6 overflow-hidden">
        {/* Sidebar Left */}
        <Sidebar className="h-full shrink-0" />

        {/* Right side area: topbar + main content */}
        <div className="flex-1 flex flex-col gap-6 h-full min-w-0">
          <DesktopHeader />
          <main className="flex-1 overflow-auto min-h-0 min-w-0 flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Sidebar } from '@/components/nav/Sidebar';
import { MobileHeader } from '@/components/nav/MobileHeader';
import { BottomTabBar } from '@/components/nav/BottomTabBar';

/**
 * Shell layout wrapping all /assignments/* routes.
 * Desktop: fixed sidebar + right-offset main content.
 * Mobile: top header + bottom tab bar, full-width content.
 */
export default function AssignmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg-page">
      {/* Desktop sidebar — visible md+ */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile header — visible below md */}
      <MobileHeader />

      {/* Main content — offset by sidebar width + margins on desktop */}
      <main className="md:pl-[calc(304px+1.5rem+1.5rem)] pt-0 md:pt-3">
        <div className="px-4 md:px-8 py-4 md:py-8">{children}</div>
      </main>

      {/* Mobile bottom tab bar — visible below md */}
      <BottomTabBar />
    </div>
  );
}

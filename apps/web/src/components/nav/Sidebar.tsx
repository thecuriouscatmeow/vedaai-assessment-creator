'use client';

import { SidebarPanel } from './SidebarPanel';

/**
 * Desktop sidebar — fixed left panel, visible on md+ screens.
 * Hidden on mobile (parent wraps with `hidden md:block`).
 */
export function Sidebar({ className = '' }: { className?: string }) {
  return (
    <aside className={`w-[304px] bg-surface rounded-[1rem] shadow-[var(--shadow-sidebar)] flex flex-col justify-between p-6 shrink-0 ${className}`}>
      <SidebarPanel />
    </aside>
  );
}

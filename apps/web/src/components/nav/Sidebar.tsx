'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import copy from '@/content/copy.json';

/**
 * Desktop sidebar — fixed left panel, visible on md+ screens.
 * Hidden on mobile (parent wraps with `hidden md:block`).
 */

interface NavItem {
  label: string;
  href: string;
  icon: string;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: '⊞', disabled: true },
  { label: 'Assignments', href: '/assignments', icon: '📋', disabled: false },
  { label: 'My Library', href: '#', icon: '📚', disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 w-[304px] min-h-dvh bg-surface rounded-[16px] shadow-[var(--shadow-sidebar)] flex flex-col justify-between p-6 m-3">
      {/* ── Top section ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-14">
        {/* Logo row */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-[10px] bg-gradient-to-b from-[#e56820] to-[#d45e3e] flex items-center justify-center text-white font-bold select-none">
            V
          </div>
          <span className="font-bold text-[1.75rem] tracking-[-0.105rem] text-text-primary leading-none">
            {copy.app.name}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {/* Create Assignment button */}
          <Link
            href="/assignments/create"
            className="bg-btn-dark border border-white/50 rounded-full flex items-center justify-center gap-1 px-6 py-2 text-white text-p3 font-medium w-full"
          >
            <span aria-hidden="true">+</span>
            <span>{copy.layout.sidebar.createAssignment}</span>
          </Link>

          {/* Nav items */}
          <nav aria-label="Main navigation">
            <ul className="flex flex-col gap-2 list-none m-0 p-0">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href !== '#' && pathname.startsWith(item.href);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={[
                        'flex items-center gap-2 px-3 py-[9px] w-full text-p3 text-text-secondary rounded-[8px] transition-colors',
                        isActive ? 'bg-surface-hover' : '',
                        item.disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : '',
                      ].join(' ')}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* ── Bottom section ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {/* Settings row */}
        <div className="flex items-center gap-2 px-3 py-2 text-p4 text-text-secondary">
          <span aria-hidden="true">⚙</span>
          <span>{copy.layout.sidebar.nav.settings}</span>
        </div>

        {/* User profile card */}
        <div className="bg-surface-hover rounded-[16px] p-3 flex items-center gap-2">
          <div
            className="size-14 rounded-full bg-grey-2 flex-shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-p3 font-bold text-text-primary truncate">
              {copy.profile.name}
            </p>
            <p className="text-p4 text-text-secondary truncate">
              {copy.profile.location}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

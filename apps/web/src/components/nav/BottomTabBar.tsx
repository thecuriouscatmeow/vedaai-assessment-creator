'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@vedaai/shared';

/**
 * Mobile bottom tab bar.
 * Hidden on md+ screens via `md:hidden`.
 * Returns null on assignment detail pages (e.g. /assignments/<id>) so the
 * full-screen output view isn't cluttered. Visible on /assignments and
 * /assignments/create.
 */

const TABS: NavItem[] = [
  { label: 'Home', href: '/', icon: '⊞', disabled: true },
  { label: 'Assignments', href: '/assignments', icon: '📋', disabled: false },
  { label: 'Library', href: '#', icon: '📚', disabled: true },
  { label: 'AI Toolkit', href: '#', icon: '✨', disabled: true },
];

/** Regex: /assignments/<segment> but NOT /assignments/create */
const DETAIL_RE = /^\/assignments\/(?!create$)[^/]+$/;

export function BottomTabBar() {
  const pathname = usePathname();

  if (DETAIL_RE.test(pathname)) {
    return null;
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4"
      aria-label="Bottom navigation"
    >
      <ul className="bg-dark-grey rounded-[28px] px-4 py-2 flex items-center justify-around w-full max-w-sm list-none m-0 p-0">
        {TABS.map((tab) => {
          const isActive = !tab.disabled && tab.href !== '#' && pathname.startsWith(tab.href);
          return (
            <li key={tab.label}>
              <Link
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex flex-col items-center gap-1 py-1 px-3 text-p5',
                  isActive ? 'text-white' : 'text-white/50',
                  tab.disabled ? 'pointer-events-none' : '',
                ].join(' ')}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

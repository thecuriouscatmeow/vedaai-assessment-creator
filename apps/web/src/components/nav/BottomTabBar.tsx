'use client';

import { usePathname } from 'next/navigation';
import { isAssignmentDetailPath, MOBILE_TAB_ITEMS } from './nav-config';
import { NavItemLink } from './NavItemLink';

/**
 * Mobile bottom tab bar.
 * Hidden on lg+ screens via `lg:hidden`.
 * Returns null on assignment detail pages so the output view stays full-screen.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  if (isAssignmentDetailPath(pathname)) {
    return null;
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4 z-40"
      aria-label="Bottom navigation"
    >
      <ul className="bg-dark-grey rounded-[1.75rem] px-4 py-2 flex items-center justify-around w-full max-w-sm list-none m-0">
        {MOBILE_TAB_ITEMS.map((tab) => (
          <li key={tab.label}>
            <NavItemLink item={tab} pathname={pathname} variant="tab" />
          </li>
        ))}
      </ul>
    </nav>
  );
}

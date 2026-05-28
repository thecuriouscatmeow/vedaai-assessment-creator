'use client';

import { usePathname, useRouter } from 'next/navigation';
import copy from '@/content/copy.json';

/**
 * Mobile top header — visible below md breakpoint, hidden on md+.
 * Includes a sub-header with a back button and page title for inner pages.
 */

function getPageTitle(pathname: string): string {
  if (pathname === '/assignments/create') {
    return copy.assignmentForm.headingCreate;
  }
  if (/^\/assignments\/[^/]+$/.test(pathname) && pathname !== '/assignments/create') {
    return copy.layout.topbar.title;
  }
  return '';
}

/** Show sub-header on inner pages but not on the assignments list itself */
function showSubHeader(pathname: string): boolean {
  if (pathname === '/assignments') return false;
  if (pathname.startsWith('/assignments/')) return true;
  return false;
}

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);
  const hasSubHeader = showSubHeader(pathname);

  return (
    <header className="md:hidden">
      {/* Main header card */}
      <div className="bg-surface rounded-[16px] shadow-[var(--shadow-card)] mx-3 mt-3 px-4 py-3 flex items-center justify-between">
        {/* Left: logo */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-[10px] bg-gradient-to-b from-[#e56820] to-[#d45e3e] flex items-center justify-center text-white font-bold select-none">
            V
          </div>
          <span className="font-bold text-[1.75rem] tracking-[-0.105rem] text-text-primary leading-none">
            {copy.app.name}
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {/* Notification bell with badge */}
          <button
            type="button"
            aria-label={copy.layout.topbar.notificationLabel}
            className="relative"
          >
            <span aria-hidden="true" className="text-text-secondary text-p2">🔔</span>
            <span className="absolute size-2 bg-red rounded-full top-0 right-0" aria-hidden="true" />
          </button>

          {/* User avatar */}
          <button
            type="button"
            className="size-8 rounded-full bg-grey-2"
            aria-label={copy.layout.topbar.userMenuLabel}
          />

          {/* Hamburger */}
          <button
            type="button"
            aria-label="Menu"
            className="text-text-primary text-p1"
          >
            ≡
          </button>
        </div>
      </div>

      {/* Sub-header for inner pages */}
      {hasSubHeader && (
        <div className="flex items-center px-4 py-2">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="text-text-primary text-p3 shrink-0"
          >
            ←
          </button>
          {pageTitle && (
            <p className="flex-1 text-center font-semibold text-p3 text-text-primary">
              {pageTitle}
            </p>
          )}
        </div>
      )}
    </header>
  );
}

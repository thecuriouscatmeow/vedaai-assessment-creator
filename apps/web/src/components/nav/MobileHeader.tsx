'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import copy from '@/content/copy.json';
import { figmaAssets } from '@/lib/figmaAssets';
import { MobileNavDrawer } from './MobileNavDrawer';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);
  const hasSubHeader = showSubHeader(pathname);

  return (
    <header className="lg:hidden">
      <div className="bg-surface rounded-[1rem] shadow-[var(--shadow-card)] mx-3 mt-3 pl-3 pr-4 py-3 flex items-center justify-between min-h-14">
        <div className="flex items-center gap-2">
          <img
            src={figmaAssets.shell.mobile.logoMark || '/assets/logo_desktop.png'}
            onError={(e) => {
              e.currentTarget.src = '/assets/logo_desktop.png';
            }}
            alt={copy.layout.sidebar.logoAlt}
            className="size-7 shrink-0"
          />
          <span className="font-bold text-[1.25rem] tracking-[-0.075rem] text-text-primary leading-[1.4]">
            {copy.app.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={copy.layout.topbar.notificationLabel}
            className="relative flex size-9 items-center justify-center rounded-full bg-bg-page shrink-0"
          >
            <img src={figmaAssets.shell.mobile.bell} alt="" aria-hidden="true" className="size-6" />
            <span
              className="absolute size-2 bg-red rounded-full top-0.5 right-0.5"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            className="size-8 rounded-full overflow-hidden shrink-0"
            aria-label={copy.layout.topbar.userMenuLabel}
          >
            <img
              src={figmaAssets.shell.mobile.avatar}
              alt=""
              aria-hidden="true"
              className="size-8 rounded-full object-cover"
            />
          </button>

          <button
            type="button"
            aria-label={copy.layout.topbar.menuLabel}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMenuOpen(true)}
            className="shrink-0"
          >
            <img src={figmaAssets.shell.mobile.menu} alt="" aria-hidden="true" className="size-6" />
          </button>
        </div>
      </div>

      {hasSubHeader && (
        <div className="flex items-center px-4 py-2">
          <button
            type="button"
            aria-label={copy.layout.topbar.backLabel}
            onClick={() => router.back()}
            className="text-text-primary shrink-0"
          >
            <img src={figmaAssets.shell.mobile.back} alt="" aria-hidden="true" className="size-4" />
          </button>
          {pageTitle && (
            <p className="flex-1 text-center font-semibold text-p3 text-text-primary">
              {pageTitle}
            </p>
          )}
        </div>
      )}

      <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

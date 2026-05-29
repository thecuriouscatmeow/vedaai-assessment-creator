'use client';

import { usePathname, useRouter } from 'next/navigation';
import copy from '@/content/copy.json';
import { figmaAssets } from '@/lib/figmaAssets';

function getPageTitle(pathname: string): string {
  if (pathname === '/assignments/create') {
    return copy.assignmentForm.headingCreate;
  }
  if (/^\/assignments\/[^/]+$/.test(pathname) && pathname !== '/assignments/create') {
    return copy.layout.topbar.title;
  }
  return copy.layout.topbar.title; // Default to "Assignment"
}

export function DesktopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);

  // Default logo or image fallbacks
  const defaultAvatar = '/assets/figma/pages/00-layout/1-9752-avatar.png';
  const defaultBell = '/assets/figma/pages/00-layout/bell.png';

  return (
    <header className="w-full h-14 bg-surface/75 backdrop-blur-md rounded-[16px] px-6 py-2 flex items-center justify-between border border-grey-3/30 shadow-[var(--shadow-card)] shrink-0 select-none">
      {/* Left side: Back Button & Page Title (Breadcrumb) */}
      <div className="flex items-center gap-4.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="size-10 flex items-center justify-center bg-white border border-grey-2/50 rounded-full hover:bg-surface-hover hover:border-text-secondary/35 active:scale-95 transition-all duration-200 cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.02)] shrink-0"
          aria-label={copy.layout.topbar.backLabel}
        >
          <img
            src={figmaAssets.shell.mobile.back}
            alt=""
            aria-hidden="true"
            className="size-4 opacity-75 group-hover:opacity-100"
          />
        </button>

        <div className="flex flex-col justify-center select-none">
          <span className="font-semibold text-text-disabled text-fluid-sm tracking-[-0.04em] leading-normal">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Right side: Bell Notification & User Pill */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell */}
        <button
          type="button"
          aria-label={copy.layout.topbar.notificationLabel}
          className="relative size-9 flex items-center justify-center rounded-full bg-bg-page hover:bg-surface-hover border border-transparent hover:border-grey-2/30 active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
        >
          <img
            src={figmaAssets.shell.mobile.bell || defaultBell}
            onError={(e) => {
              e.currentTarget.src = defaultBell;
            }}
            alt=""
            aria-hidden="true"
            className="size-[20px] object-contain opacity-85"
          />
          <span
            className="absolute size-2 bg-red rounded-full top-1 right-1 border border-white"
            aria-hidden="true"
          />
        </button>

        {/* User Profile Card / Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-grey-2/50 bg-white hover:bg-surface-hover hover:border-text-secondary/30 transition-all duration-200 cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.02)] shrink-0 select-none">
          {/* Avatar Container */}
          <div className="relative size-8 rounded-full overflow-hidden shrink-0 border border-grey-2/30">
            <img
              src={figmaAssets.shell.desktop.avatar || defaultAvatar}
              onError={(e) => {
                e.currentTarget.src = defaultAvatar;
              }}
              alt=""
              aria-hidden="true"
              className="size-full object-cover"
            />
          </div>

          {/* User Name & Chevron */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="font-semibold text-p4 text-text-primary leading-none select-none">
              {copy.layout.topbar.userMenu}
            </span>
            <svg
              className="size-4 text-text-secondary/70 shrink-0 select-none transition-transform group-hover:translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}

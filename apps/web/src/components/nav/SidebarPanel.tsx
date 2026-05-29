'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import copy from '@/content/copy.json';
import { figmaAssets } from '@/lib/figmaAssets';
import { DESKTOP_NAV_ITEMS } from './nav-config';
import { NavItemLink } from './NavItemLink';

interface SidebarPanelProps {
  /** Called when a nav link is chosen (closes mobile drawer). */
  onNavigate?: () => void;
}

/**
 * Sidebar interior — shared by fixed desktop `Sidebar` and `MobileNavDrawer`.
 */
export function SidebarPanel({ onNavigate }: SidebarPanelProps) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex flex-col gap-14">
        <div className="flex items-center gap-2">
          <img
            src={figmaAssets.shell.desktop.logoMark || '/assets/logo_desktop.png'}
            onError={(e) => {
              e.currentTarget.src = '/assets/logo_desktop.png';
            }}
            alt={copy.layout.sidebar.logoAlt}
            className="size-10 shrink-0"
          />
          <span className="font-bold text-fluid-lg tracking-[-0.105rem] text-text-primary leading-none">
            {copy.app.name}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/assignments/create"
            onClick={onNavigate}
            className="relative bg-btn-dark border-4 border-btn-orange rounded-full flex items-center justify-center gap-2.5 px-6 py-2 text-white text-p3 font-medium w-full shadow-[inset_0_-1px_3.5px_rgba(177,177,177,0.6),inset_0_0_2.15625rem_rgba(255,255,255,0.25)]"
          >
            <img
              src={figmaAssets.shell.desktop.createAssignmentIcon}
              alt=""
              aria-hidden="true"
              className="size-[1.145rem] shrink-0"
            />
            <span>{copy.layout.sidebar.createAssignment}</span>
          </Link>

          <nav aria-label="Main navigation">
            <ul className="flex flex-col gap-2 list-none m-0 p-0">
              {DESKTOP_NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <NavItemLink
                    item={item}
                    pathname={pathname}
                    variant="sidebar"
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-2 text-p4 text-text-secondary">
          <img
            src={figmaAssets.shell.desktop.nav.settings}
            alt=""
            aria-hidden="true"
            className="size-5 shrink-0"
          />
          <span>{copy.layout.sidebar.nav.settings}</span>
        </div>

        <div className="bg-surface-hover rounded-[1rem] p-3 flex items-center gap-2">
          <img
            src={figmaAssets.shell.desktop.avatar}
            alt=""
            aria-hidden="true"
            className="size-14 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="text-p3 font-bold text-text-primary truncate">
              {copy.layout.sidebar.school.name}
            </p>
            <p className="text-p4 text-text-secondary truncate">
              {copy.layout.sidebar.school.city}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

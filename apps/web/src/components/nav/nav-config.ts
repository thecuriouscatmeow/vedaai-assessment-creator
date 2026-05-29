import copy from '@/content/copy.json';
import { figmaAssets } from '@/lib/figmaAssets';
import type { NavItem } from '@vedaai/shared';

/** Desktop sidebar width — matches Figma `Side Bar` (304px) + shell margin (12px each side). */
export const SIDEBAR_WIDTH_PX = 304;
export const SIDEBAR_SHELL_MARGIN_PX = 12;

/** Desktop sidebar primary navigation (filled-state frame). */
export const DESKTOP_NAV_ITEMS: NavItem[] = [
  {
    label: copy.layout.sidebar.nav.home,
    href: '/',
    icon: figmaAssets.shell.desktop.nav.home,
    disabled: true,
  },
  {
    label: copy.layout.sidebar.nav.myGroups,
    href: '#',
    icon: figmaAssets.shell.desktop.nav.myGroups,
    disabled: true,
  },
  {
    label: copy.layout.sidebar.nav.assignments,
    href: '/assignments',
    icon: figmaAssets.shell.desktop.nav.assignments,
    disabled: false,
  },
  {
    label: copy.layout.sidebar.nav.aiToolkit,
    href: '#',
    icon: figmaAssets.shell.desktop.nav.aiToolkit,
    disabled: true,
  },
  {
    label: copy.layout.sidebar.nav.myLibrary,
    href: '#',
    icon: figmaAssets.shell.desktop.nav.myLibrary,
    disabled: true,
  },
];

/** Mobile bottom tab bar items (filled-state mobile frame). */
export const MOBILE_TAB_ITEMS: NavItem[] = [
  {
    label: copy.layout.mobileTabs.home,
    href: '/',
    icon: figmaAssets.shell.mobile.tabs.home,
    disabled: true,
  },
  {
    label: copy.layout.mobileTabs.assignments,
    href: '/assignments',
    icon: figmaAssets.shell.mobile.tabs.assignments,
    disabled: false,
  },
  {
    label: copy.layout.mobileTabs.library,
    href: '#',
    icon: figmaAssets.shell.mobile.tabs.library,
    disabled: true,
  },
  {
    label: copy.layout.mobileTabs.aiToolkit,
    href: '#',
    icon: figmaAssets.shell.mobile.tabs.aiToolkit,
    disabled: true,
  },
];

/** True when pathname is an assignment detail page (hides bottom tabs). */
export function isAssignmentDetailPath(pathname: string): boolean {
  return /^\/assignments\/(?!create$)[^/]+$/.test(pathname);
}

/** Active nav item — assignments matches all `/assignments/*` routes. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '#' || href === '/') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

'use client';

import Link from 'next/link';
import type { NavItem } from '@vedaai/shared';
import { isNavItemActive } from './nav-config';

export type NavItemLinkVariant = 'sidebar' | 'drawer' | 'tab';

interface NavItemLinkProps {
  item: NavItem;
  pathname: string;
  variant: NavItemLinkVariant;
  onNavigate?: () => void;
}

const variantClasses: Record<NavItemLinkVariant, { base: string; active: string }> = {
  sidebar: {
    base: 'flex items-center gap-2 px-3 py-[0.5625rem] w-full text-p3 rounded-[0.5rem] transition-colors',
    active: 'bg-surface-hover text-text-primary font-medium',
  },
  drawer: {
    base: 'flex items-center gap-2 px-3 py-[0.5625rem] w-full text-p3 rounded-[0.5rem] transition-colors',
    active: 'bg-surface-hover text-text-primary font-medium',
  },
  tab: {
    base: 'flex flex-col items-center gap-1 py-1 px-3 text-p5',
    active: 'text-white',
  },
};

/**
 * Shared nav row — sidebar, mobile drawer, and bottom tabs.
 * Disabled items render as non-interactive spans (no dead links).
 */
export function NavItemLink({ item, pathname, variant, onNavigate }: NavItemLinkProps) {
  const isActive = !item.disabled && isNavItemActive(pathname, item.href);
  const styles = variantClasses[variant];

  const className = [
    styles.base,
    isActive ? styles.active : '',
    variant === 'tab' && !isActive ? 'text-white/50' : '',
    variant !== 'tab' && !isActive ? 'text-text-secondary' : '',
    item.disabled ? 'opacity-50 cursor-not-allowed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <img src={item.icon} alt="" aria-hidden="true" className={variant === 'tab' ? 'size-4' : 'size-5 shrink-0'} />
      <span>{item.label}</span>
    </>
  );

  if (item.disabled) {
    return (
      <span className={className} aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={className}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}

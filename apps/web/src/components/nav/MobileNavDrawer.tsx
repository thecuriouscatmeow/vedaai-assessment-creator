'use client';

import { useEffect, useId, useRef } from 'react';
import copy from '@/content/copy.json';
import { SidebarPanel } from './SidebarPanel';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Mobile navigation drawer — same content as the desktop sidebar.
 * Opened from the hamburger in `MobileHeader`.
 */
export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label={copy.layout.topbar.closeMenuLabel}
        onClick={onClose}
      />

      <aside
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute top-0 left-0 bottom-0 w-[min(19rem,88%)] max-w-[304px] bg-surface shadow-[var(--shadow-sidebar)] flex flex-col justify-between p-6 m-3 rounded-[1rem]"
      >
        <span id={titleId} className="sr-only">
          {copy.layout.topbar.menuLabel}
        </span>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="sr-only"
        >
          {copy.layout.topbar.closeMenuLabel}
        </button>

        <SidebarPanel onNavigate={onClose} />
      </aside>
    </div>
  );
}

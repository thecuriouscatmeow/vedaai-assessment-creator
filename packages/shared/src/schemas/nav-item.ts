import { z } from 'zod';

/**
 * Canonical nav-item shape used by Sidebar, BottomTabBar, and any future
 * navigation component. Single source of truth — no local interface copies.
 */
export const NavItemSchema = z.object({
  label: z.string(),
  href: z.string(),
  icon: z.string(),
  disabled: z.boolean().optional(),
});

export type NavItem = z.infer<typeof NavItemSchema>;

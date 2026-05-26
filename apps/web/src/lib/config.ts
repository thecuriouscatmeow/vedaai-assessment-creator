/**
 * Web runtime config.
 *
 * `NEXT_PUBLIC_*` vars are inlined at build time by Next.js. We default to the
 * local API port so development works without an explicit `.env.local`.
 * Never import server-only env vars here — this module runs in the browser.
 */
export const API_URL: string =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

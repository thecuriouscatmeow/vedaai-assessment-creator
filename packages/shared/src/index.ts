/**
 * @vedaai/shared — the single source of truth for cross-app contracts.
 *
 * Both `apps/web` and `apps/api` import schemas and their inferred types from
 * exactly one place: `import { ... } from '@vedaai/shared'`. All TypeScript
 * types here are `z.infer` of a Zod schema — no hand-written, drift-prone defs.
 */
export const SHARED_PACKAGE = '@vedaai/shared' as const;

export * from './schemas/assignment';
export * from './schemas/question-paper';
export * from './schemas/socket';
export * from './schemas/nav-item';

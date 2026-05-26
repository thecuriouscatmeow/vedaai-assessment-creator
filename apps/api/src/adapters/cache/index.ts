/**
 * Cache adapter contract. Wraps Redis; used to memoise generation results by a
 * hash of the normalized AssignmentInput. Implementation lands in Phase 4.
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

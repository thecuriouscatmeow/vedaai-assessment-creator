/**
 * Database adapter contract. Wraps the MongoDB driver/ODM so persistence can
 * be swapped without rippling into services. Repository interfaces and the
 * Mongo implementation land in Phase 4.
 */
export interface DbAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

import mongoose from 'mongoose';
import type { Logger } from 'pino';
import type { DbAdapter } from './index';

/**
 * MongoDB adapter using Mongoose.
 *
 * Wraps mongoose connection lifecycle to implement the DbAdapter contract.
 * Fail-fast (serverSelectionTimeoutMS) ensures boot-time errors surface immediately.
 * Provider-agnostic design allows swapping the ODM or driver without touching services.
 */
export function createMongooseAdapter(uri: string, logger: Logger): DbAdapter {
  return {
    async connect() {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info({ msg: 'db:connected' });
    },

    async disconnect() {
      await mongoose.disconnect();
      logger.info({ msg: 'db:disconnected' });
    },

    isConnected() {
      return mongoose.connection.readyState === 1;
    },
  };
}

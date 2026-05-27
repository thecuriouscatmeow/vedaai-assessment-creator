import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createMongooseAdapter } from './mongoose.adapter';
import { createLogger } from '../../lib/logger';
import type { Logger } from 'pino';

vi.mock('mongoose', async () => {
  const mockMongoose = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    connection: {
      readyState: 1,
    },
  };
  return {
    default: mockMongoose,
  };
});

describe('MongooseAdapter', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = createLogger({
      isProduction: false,
      logLevel: 'silent',
    });
    vi.clearAllMocks();
  });

  describe('connect', () => {
    it('resolves and logs db:connected on success', async () => {
      const mongoose = await import('mongoose');
      vi.mocked(mongoose.default.connect).mockResolvedValueOnce({} as any);

      const adapter = createMongooseAdapter('mongodb://localhost:27017/veda', logger);
      const logSpy = vi.spyOn(logger, 'info');

      await adapter.connect();

      expect(vi.mocked(mongoose.default.connect)).toHaveBeenCalledWith('mongodb://localhost:27017/veda', {
        serverSelectionTimeoutMS: 5000,
      });
      expect(logSpy).toHaveBeenCalledWith({ msg: 'db:connected' });
    });

    it('propagates the error when mongoose.connect throws', async () => {
      const mongoose = await import('mongoose');
      const testError = new Error('Connection failed');
      vi.mocked(mongoose.default.connect).mockRejectedValueOnce(testError);

      const adapter = createMongooseAdapter('mongodb://localhost:27017/veda', logger);

      await expect(adapter.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('calls mongoose.disconnect and logs db:disconnected', async () => {
      const mongoose = await import('mongoose');
      vi.mocked(mongoose.default.disconnect).mockResolvedValueOnce(undefined);

      const adapter = createMongooseAdapter('mongodb://localhost:27017/veda', logger);
      const logSpy = vi.spyOn(logger, 'info');

      await adapter.disconnect();

      expect(vi.mocked(mongoose.default.disconnect)).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith({ msg: 'db:disconnected' });
    });
  });

  describe('isConnected', () => {
    it('returns true when readyState is 1', async () => {
      const mongoose = await import('mongoose');
      vi.spyOn(mongoose.default.connection, 'readyState', 'get').mockReturnValueOnce(1);

      const adapter = createMongooseAdapter('mongodb://localhost:27017/veda', logger);
      expect(adapter.isConnected()).toBe(true);
    });

    it('returns false when readyState is not 1', async () => {
      const mongoose = await import('mongoose');
      vi.spyOn(mongoose.default.connection, 'readyState', 'get').mockReturnValueOnce(0);

      const adapter = createMongooseAdapter('mongodb://localhost:27017/veda', logger);
      expect(adapter.isConnected()).toBe(false);
    });
  });
});

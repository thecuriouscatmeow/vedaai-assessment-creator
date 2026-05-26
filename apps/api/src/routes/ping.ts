import { Router } from 'express';
import type { PingService } from '../services/ping.service';

/**
 * Ping router — walking-skeleton endpoint.
 *
 * `POST /ping` enqueues a generation job and immediately returns the new
 * assignment id so the client can subscribe to Socket.IO events (M2). The
 * controller depends only on `PingService`; BullMQ and Redis never surface
 * here. Express 5 forwards rejected async promise errors to the next error
 * handler automatically, so no try/catch wrapper is required.
 */

export interface PingRouterDeps {
  pingService: PingService;
}

export function createPingRouter({ pingService }: PingRouterDeps): Router {
  const router = Router();

  router.post('/ping', async (req, res) => {
    const result = await pingService.ping(req.body?.input);
    req.log.info({ assignmentId: result.assignmentId }, 'ping: job enqueued');
    res.status(202).json(result);
  });

  return router;
}

import { Router, type RequestHandler } from 'express';
import type { StorageAdapter } from '../adapters/storage/index';

/**
 * Upload router.
 *
 * GET /api/uploads/signature
 *   Returns the signed Cloudinary upload parameters the browser needs to POST
 *   a file directly to Cloudinary without routing through the API server.
 *
 * Response shape (used by the frontend to call Cloudinary's upload endpoint):
 *   { signature: string, timestamp: number, apiKey: string, cloudName: string, folder: string }
 */

export interface UploadRouterDeps {
  storageAdapter: StorageAdapter;
}

export function createUploadRouter({ storageAdapter }: UploadRouterDeps): Router {
  const router = Router();

  const signatureHandler: RequestHandler = (req, res, next) => {
    try {
      const folder = typeof req.query['folder'] === 'string' ? req.query['folder'] : undefined;
      const sig = storageAdapter.createSignedUpload(folder);
      res.status(200).json({
        signature: sig.signature,
        timestamp: sig.timestamp,
        apiKey: sig.apiKey,
        cloudName: sig.cloudName,
        folder: sig.folder ?? 'assignments',
      });
    } catch (err) {
      next(err);
    }
  };

  router.get('/signature', signatureHandler);

  return router;
}

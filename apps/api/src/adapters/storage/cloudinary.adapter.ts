import { v2 as cloudinary } from 'cloudinary';
import type { StorageAdapter, UploadSignature } from './index';
import type { AppConfig } from '../../lib/config';

/**
 * Cloudinary implementation of {@link StorageAdapter}.
 *
 * Generates a signed upload payload that the frontend uses to POST files
 * directly to Cloudinary. The API never handles the binary — it only signs
 * the upload parameters (timestamp + optional folder).
 *
 * Only this file touches the Cloudinary SDK; a future swap to another provider
 * touches this file alone.
 */
export function createCloudinaryAdapter(config: AppConfig): StorageAdapter {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;

  return {
    name: 'cloudinary',

    createSignedUpload(folder = 'assignments'): UploadSignature {
      const timestamp = Math.round(Date.now() / 1000);

      const paramsToSign: Record<string, string | number> = { timestamp, folder };

      const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

      return { cloudName, apiKey, timestamp, signature, folder };
    },
  };
}

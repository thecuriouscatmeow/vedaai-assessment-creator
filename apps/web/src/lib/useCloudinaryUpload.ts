'use client';

import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUploading } from '@/store/slices/assignmentFormSlice';
import { API_URL } from './config';

/**
 * Signature response shape from GET /api/uploads/signature.
 * The backend returns these fields; the frontend constructs the Cloudinary
 * upload URL directly from them so no file bytes ever pass through our API.
 */
export interface SignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/**
 * useCloudinaryUpload — handles the two-step direct upload pattern:
 *  1. Request a signed upload ticket from our API (GET /api/uploads/signature).
 *  2. POST the file directly to Cloudinary's upload endpoint.
 *  3. Return the secure_url from Cloudinary's response.
 *
 * No base64 or multer — the API only ever sees a URL.
 * Upload state (uploading flag) is reflected in the Redux store so the form
 * can disable the submit button while an upload is in flight.
 */
export function useCloudinaryUpload() {
  const dispatch = useAppDispatch();

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      dispatch(setUploading(true));

      try {
        // Step 1: fetch a signed upload ticket from our API
        const sigRes = await fetch(`${API_URL}/api/uploads/signature`);
        if (!sigRes.ok) {
          throw new Error(`Signature request failed: HTTP ${String(sigRes.status)}`);
        }
        const { signature, timestamp, apiKey, cloudName, folder } =
          (await sigRes.json()) as SignatureResponse;

        // Step 2: upload directly to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);
        formData.append('folder', folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          { method: 'POST', body: formData },
        );

        if (!uploadRes.ok) {
          throw new Error(`Cloudinary upload failed: HTTP ${String(uploadRes.status)}`);
        }

        const data = (await uploadRes.json()) as { secure_url: string };
        return data.secure_url;
      } catch {
        return null;
      } finally {
        dispatch(setUploading(false));
      }
    },
    [dispatch],
  );

  return { upload };
}

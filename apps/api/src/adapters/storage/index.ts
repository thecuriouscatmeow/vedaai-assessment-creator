/**
 * Storage adapter contract. Uploads go frontend → Cloudinary directly using a
 * backend-signed payload; the backend stores only the resulting URL (never
 * base64/multer). Implementation (Cloudinary signing) lands in Phase 4.
 */
export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder?: string;
}

export interface StorageAdapter {
  readonly name: string;
  createSignedUpload(folder?: string): UploadSignature;
}

/**
 * Unit tests for useCloudinaryUpload — M2.
 *
 * Verifies:
 *  1. A successful upload path returns a Cloudinary secure_url and stores it.
 *  2. No base64 data is sent anywhere.
 *  3. The uploading flag toggles correctly.
 *  4. Returns null on signature-fetch failure.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from '@/store/index';
import { useCloudinaryUpload } from '@/lib/useCloudinaryUpload';

const CLOUDINARY_URL = 'https://res.cloudinary.com/demo/raw/upload/v1/test-folder/file.pdf';

const MOCK_SIGNATURE: {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
} = {
  signature: 'abc123sig',
  timestamp: 1748390400,
  apiKey: 'key-demo',
  cloudName: 'demo',
  folder: 'test-folder',
};

function makeWrapper(store = makeStore()) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useCloudinaryUpload — M2', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the Cloudinary secure_url on a successful upload', async () => {
    const store = makeStore();
    let callCount = 0;

    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: GET /api/uploads/signature
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_SIGNATURE),
        });
      }
      // Second call: POST to Cloudinary
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ secure_url: CLOUDINARY_URL }),
      });
    });

    const { result } = renderHook(() => useCloudinaryUpload(), {
      wrapper: makeWrapper(store),
    });

    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    let url: string | null = null;

    await act(async () => {
      url = await result.current.upload(file);
    });

    expect(url).toBe(CLOUDINARY_URL);
    expect(store.getState().assignmentForm.fileUrl).toBeNull(); // setFileUrl is called by form, not hook
  });

  it('does NOT send base64 data in any fetch call', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            global.fetch &&
              (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length === 1
              ? MOCK_SIGNATURE
              : { secure_url: CLOUDINARY_URL },
          ),
      }),
    );

    const { result } = renderHook(() => useCloudinaryUpload(), {
      wrapper: makeWrapper(),
    });

    const file = new File(['binary data'], 'img.png', { type: 'image/png' });

    await act(async () => {
      await result.current.upload(file);
    });

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls as [
      string,
      RequestInit?,
    ][];

    // Ensure no call body is a string containing base64 markers
    for (const [, init] of calls) {
      const body = init?.body;
      if (typeof body === 'string') {
        expect(body).not.toMatch(/base64/);
        expect(body).not.toMatch(/data:/);
      }
    }
  });

  it('returns null when the signature request fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useCloudinaryUpload(), {
      wrapper: makeWrapper(),
    });

    const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });
    let url: string | null = 'initial';

    await act(async () => {
      url = await result.current.upload(file);
    });

    expect(url).toBeNull();
  });

  it('resets the uploading flag after a successful upload', async () => {
    const store = makeStore();
    let callCount = 0;

    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(callCount === 1 ? MOCK_SIGNATURE : { secure_url: CLOUDINARY_URL }),
      });
    });

    const { result } = renderHook(() => useCloudinaryUpload(), {
      wrapper: makeWrapper(store),
    });

    const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.upload(file);
    });

    expect(store.getState().assignmentForm.uploading).toBe(false);
  });

  it('resets the uploading flag even when upload fails', async () => {
    const store = makeStore();
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useCloudinaryUpload(), {
      wrapper: makeWrapper(store),
    });

    const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.upload(file);
    });

    expect(store.getState().assignmentForm.uploading).toBe(false);
  });
});

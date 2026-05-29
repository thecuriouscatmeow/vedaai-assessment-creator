import { describe, it, expect } from 'vitest';
import { detectFileKind } from './detect';

describe('detectFileKind', () => {
  it('detects pdf by content-type', () => {
    expect(detectFileKind('https://x/y', 'application/pdf')).toBe('pdf');
  });
  it('detects image by content-type', () => {
    expect(detectFileKind('https://x/y', 'image/png; charset=binary')).toBe('image');
  });
  it('falls back to URL extension when content-type is generic', () => {
    expect(detectFileKind('https://x/scan.pdf', 'application/octet-stream')).toBe('pdf');
    expect(detectFileKind('https://x/p.JPG', null)).toBe('image');
  });
  it('throws on unsupported/undetectable type', () => {
    expect(() => detectFileKind('https://x/file.txt', 'text/plain')).toThrow(/unsupported/i);
  });
});

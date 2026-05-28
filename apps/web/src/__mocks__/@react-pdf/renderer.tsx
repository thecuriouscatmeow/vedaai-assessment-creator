/**
 * Manual vitest mock for @react-pdf/renderer.
 *
 * Used in test environments (jsdom) where the real PDF engine is unavailable.
 * The alias in vitest.config.ts routes `@react-pdf/renderer` here for all tests.
 */
import React from 'react';
import { vi } from 'vitest';

export const PDFDownloadLink = ({
  children,
  fileName: _fileName,
  document: _document,
  ...rest
}: {
  children: (opts: { loading: boolean }) => React.ReactNode;
  document: React.ReactNode;
  fileName: string;
  [key: string]: unknown;
}) => (
  <a data-testid="pdf-download-link" {...rest}>
    {children({ loading: false })}
  </a>
);

export const Document = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const Page = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const View = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const Text = ({ children }: { children: React.ReactNode }) => (
  <span>{children}</span>
);

export const StyleSheet = { create: (s: unknown) => s };

export const Font = { register: vi.fn() };

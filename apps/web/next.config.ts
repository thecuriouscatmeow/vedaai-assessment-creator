import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output: self-contained server bundle for Docker (M4).
  // Copies only the required node_modules subset into .next/standalone.
  output: 'standalone',
  // @vedaai/shared is published as TypeScript source (a just-in-time internal
  // package), so Next must transpile it rather than expecting prebuilt JS.
  transpilePackages: ['@vedaai/shared'],
};

export default nextConfig;

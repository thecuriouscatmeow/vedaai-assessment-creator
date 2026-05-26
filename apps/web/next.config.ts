import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @vedaai/shared is published as TypeScript source (a just-in-time internal
  // package), so Next must transpile it rather than expecting prebuilt JS.
  transpilePackages: ['@vedaai/shared'],
};

export default nextConfig;

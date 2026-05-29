import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // @vedaai/shared is TypeScript source — Next must transpile it rather than
  // expecting prebuilt JS.
  transpilePackages: ['@vedaai/shared'],
};

export default nextConfig;

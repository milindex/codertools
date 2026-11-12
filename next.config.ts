import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export keeps the app deployable to any static host (Netlify, S3, ...).
  output: 'export',
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

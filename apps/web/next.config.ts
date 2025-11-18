import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone mode to fix static file serving
  // output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ordernestpro.rugvedaitech.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow unoptimized images for external domains not in the list
    unoptimized: false,
  },
  // Configure static file serving
  trailingSlash: false,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;

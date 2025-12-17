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
  // Add headers for cache control and security
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' http: https: data: blob: 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: blob:; style-src 'self' 'unsafe-inline' http: https:; img-src 'self' data: blob: http: https:; font-src 'self' data: http: https:; connect-src 'self' http: https: ws: wss:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

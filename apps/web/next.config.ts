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
        ],
  },
  // Configure static file serving
  trailingSlash: false,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
  // Ensure static files are properly generated and served
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Configure static file serving
  trailingSlash: false,
  // Ensure proper asset prefix for static files
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
};

export default nextConfig;

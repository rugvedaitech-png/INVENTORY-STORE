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
  // Ensure static files are properly generated
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
};

export default nextConfig;

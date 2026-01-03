import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production and high-scale deployment
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header (security)
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache for images
  },
  
  // Security headers (additional to middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Download-Options',
            value: 'noopen'
          },
        ],
      },
    ];
  },
  
  // Optimize bundle size
  experimental: {
    optimizePackageImports: ['mongodb'],
  },
};

export default nextConfig;

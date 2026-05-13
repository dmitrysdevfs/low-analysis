import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  async rewrites() {
    const backendUrl =
      process.env.API_PROXY_TARGET_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://low-analysis.onrender.com';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

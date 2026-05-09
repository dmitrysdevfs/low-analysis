import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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

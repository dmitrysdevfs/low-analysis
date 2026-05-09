import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // За замовчуванням фронтенд стукається на живий бекенд, 
    // щоб розробникам не доводилось локально піднімати БД.
    // Для локального бекенду створіть .env.local і додайте:
    // NEXT_PUBLIC_API_URL=http://localhost:3000
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://low-analysis.onrender.com';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

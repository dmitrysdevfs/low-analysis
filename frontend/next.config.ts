import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  async rewrites() {
    const backendUrl =
      process.env.API_PROXY_TARGET_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://low-analysis.onrender.com";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "law-analysis",
  project: "javascript-nextjs",
  silent: true,
  disableLogger: true,
  sourcemaps: {
    disable: true,
  },
});

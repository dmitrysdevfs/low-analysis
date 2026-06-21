import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  // Prevents embedding in iframes — clickjacking protection
  { key: "X-Frame-Options", value: "DENY" },
  // Prevents MIME-type sniffing attacks
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controls how much referrer info is sent
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restricts browser APIs that aren't used
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Forces HTTPS for 2 years (production only)
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
  // Partial CSP — blocks unknown external scripts/objects/base-tag hijacking
  // unsafe-inline + unsafe-eval required for Next.js hydration; full nonce-based CSP is a separate task
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.clarity.ms https://www.googletagmanager.com https://accounts.google.com https://*.sentry.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://www.clarity.ms https://www.google-analytics.com https://region1.google-analytics.com https://*.ingest.de.sentry.io https://accounts.google.com wss: ws:",
      "frame-src https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
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

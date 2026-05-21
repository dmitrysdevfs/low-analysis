import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://low-analysis.onrender.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/laws", "/subjects", "/search"],
        disallow: ["/admin", "/account", "/api"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://low-analysis.onrender.com";
  const backendUrl =
    process.env.API_PROXY_TARGET_URL || "https://low-analysis.onrender.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/laws`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/subjects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    const res = await fetch(`${backendUrl}/api/laws`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const laws: Array<{ _id: string }> = await res.json();
      const lawRoutes: MetadataRoute.Sitemap = laws.map((law) => ({
        url: `${siteUrl}/laws/${law._id}`,
        changeFrequency: "monthly",
        priority: 0.8,
      }));
      return [...staticRoutes, ...lawRoutes];
    }
  } catch {
    // return static only
  }

  return staticRoutes;
}

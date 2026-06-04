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
    {
      url: `${siteUrl}/roadmap`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/analysis`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  try {
    const [lawsRes, subjectsRes] = await Promise.all([
      fetch(`${backendUrl}/api/laws`, { next: { revalidate: 86400 } }),
      fetch(`${backendUrl}/api/subjects`, { next: { revalidate: 86400 } }),
    ]);
    const lawRoutes: MetadataRoute.Sitemap = lawsRes.ok
      ? ((await lawsRes.json()) as Array<{ _id: string }>).map((law) => ({
          url: `${siteUrl}/laws/${law._id}`,
          changeFrequency: "monthly",
          priority: 0.8,
        }))
      : [];
    const subjectRoutes: MetadataRoute.Sitemap = subjectsRes.ok
      ? ((await subjectsRes.json()) as Array<{ _id: string }>).map(
          (subject) => ({
            url: `${siteUrl}/subjects/${subject._id}`,
            changeFrequency: "monthly",
            priority: 0.7,
          }),
        )
      : [];
    if (lawRoutes.length > 0 || subjectRoutes.length > 0) {
      return [...staticRoutes, ...lawRoutes, ...subjectRoutes];
    }
  } catch {
    // return static only
  }

  return staticRoutes;
}

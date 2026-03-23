import { SITE_URL } from "@/lib/site";
import { getAllMemberProfileSlugs } from "@/lib/member-profiles";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  let profiles: string[] = [];
  try {
    profiles = await getAllMemberProfileSlugs();
  } catch {
    // MongoDB unavailable — return base URLs only
  }
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.75 },
    { url: `${SITE_URL}/changelog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.65 },
    { url: `${SITE_URL}/status`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.5 },
    { url: `${SITE_URL}/docs/api`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.55 },
    { url: `${SITE_URL}/dashboard/leaderboard`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${SITE_URL}/marketplace`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    ...profiles.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

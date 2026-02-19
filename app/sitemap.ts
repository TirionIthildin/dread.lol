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
    { url: `${SITE_URL}/dashboard/leaderboard`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    ...profiles.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

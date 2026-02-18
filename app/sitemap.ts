import { SITE_URL } from "@/lib/site";
import { getProfileSlugs } from "@/lib/profiles";

export default function sitemap() {
  const profiles = getProfileSlugs();
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    ...profiles.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

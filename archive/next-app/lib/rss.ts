/**
 * Minimal RSS 2.0 XML helpers for profile blog feeds.
 */

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Plain-text excerpt for RSS description (markdown-ish content). */
export function excerptForRss(content: string, maxLen = 400): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen - 1)}…`;
}

export function buildBlogRssXml(opts: {
  siteUrl: string;
  siteName: string;
  profileName: string;
  slug: string;
  posts: { id: string; title: string; content: string; createdAt: Date; updatedAt: Date }[];
}): string {
  const { siteUrl, siteName, profileName, slug, posts } = opts;
  const blogUrl = `${siteUrl}/${encodeURIComponent(slug)}/blog`;
  const feedUrl = `${blogUrl}/rss.xml`;
  const lastBuild = posts[0]?.updatedAt ?? posts[0]?.createdAt ?? new Date();

  const itemsXml = posts
    .map((post) => {
      const link = `${siteUrl}/${encodeURIComponent(slug)}/blog/${encodeURIComponent(post.id)}`;
      const pubDate = post.createdAt.toUTCString();
      const desc = escapeXml(excerptForRss(post.content));
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${profileName}'s blog — ${siteName}`)}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>${escapeXml(`Micro-blog by ${profileName} on ${siteName}`)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <generator>${escapeXml(siteName)}</generator>
${itemsXml}
  </channel>
</rss>
`;
}

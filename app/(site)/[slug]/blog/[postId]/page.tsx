import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProfileBackground from "@/app/components/ProfileBackground";
import ProfileMarkdown from "@/app/components/ProfileMarkdown";
import {
  getMemberProfileBySlug,
  memberProfileToProfile,
  getUserBadges,
  getCustomBadgesForUser,
  getUserDiscordBadgeData,
} from "@/lib/member-profiles";
import { getBlogPost } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getThemeClass } from "@/lib/profile-themes";

type Props = { params: Promise<{ slug: string; postId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, postId } = await params;
  const memberRow = await getMemberProfileBySlug(slug);
  const post = await getBlogPost(postId);
  if (!memberRow || !post || post.profileId !== memberRow.id) {
    return { title: "Not found" };
  }
  const profile = memberProfileToProfile(memberRow);
  const title = `${post.title} · ${profile.name}'s blog`;
  const description =
    post.content.slice(0, 160).replace(/\s+/g, " ").trim() + (post.content.length > 160 ? "…" : "");
  const canonicalUrl = `${SITE_URL}/${slug}/blog/${postId}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
    },
  };
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(d));
}

export default async function ProfileBlogPostPage({ params }: Props) {
  const { slug, postId } = await params;
  const [memberRow, post] = await Promise.all([
    getMemberProfileBySlug(slug),
    getBlogPost(postId),
  ]);

  if (!memberRow || !post || post.profileId !== memberRow.id) notFound();

  const [badgeFlags, customBadges, discordBadgeData] = await Promise.all([
    getUserBadges(memberRow.userId),
    getCustomBadgesForUser(memberRow.userId),
    getUserDiscordBadgeData(memberRow.userId),
  ]);

  const profile = memberProfileToProfile(memberRow, badgeFlags, discordBadgeData, customBadges);
  const themeClass = getThemeClass(profile.accentColor);

  return (
    <ProfileBackground profile={profile}>
      <div className={`relative z-10 w-full max-h-[calc(100vh-1.5rem)] overflow-auto max-w-2xl ${themeClass}`}>
        <article className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm bg-[color-mix(in_srgb,var(--surface)_95%,transparent)]">
          <div className="flex items-center gap-2 px-3 py-2 sm:px-4 border-b border-[var(--border)] bg-[var(--bg)]/90">
            <Link
              href={`/${slug}/blog`}
              className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
            >
              ← Blog
            </Link>
            <span className="text-[var(--muted)]">·</span>
            <Link
              href={`/${slug}`}
              className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
            >
              {profile.name}
            </Link>
          </div>
          <div className="pt-4 px-4 pb-6">
            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-1">{post.title}</h1>
            <p className="text-xs text-[var(--muted)] mb-4">{formatDate(post.createdAt)}</p>
            <div className="profile-markdown prose prose-invert max-w-none text-sm text-[var(--foreground)] leading-relaxed">
              <ProfileMarkdown content={post.content} className="blog-post-content" />
            </div>
          </div>
        </article>
      </div>
    </ProfileBackground>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Article } from "@phosphor-icons/react/dist/ssr";
import ProfileBackground from "@/app/components/ProfileBackground";
import {
  getMemberProfileBySlug,
  memberProfileToProfile,
  getUserBadges,
  getCustomBadgesForUser,
  getUserDiscordBadgeData,
} from "@/lib/member-profiles";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getBlogPostsForProfile } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Profile } from "@/lib/profiles";
import { getThemeClass } from "@/lib/profile-themes";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const memberRow = await getMemberProfileBySlug(slug);
  if (!memberRow) return { title: "Not found" };
  const profile = memberProfileToProfile(memberRow);
  const title = `${profile.name}'s blog`;
  const description = `Micro-blog by ${profile.name} on ${SITE_NAME}`;
  const canonicalUrl = `${SITE_URL}/${slug}/blog`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
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
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

export default async function ProfileBlogPage({ params }: Props) {
  const { slug } = await params;
  const memberRow = await getMemberProfileBySlug(slug);
  if (!memberRow) notFound();

  const [badgeFlags, customBadges, discordBadgeData, premiumAccess, posts] = await Promise.all([
    getUserBadges(memberRow.userId),
    getCustomBadgesForUser(memberRow.userId),
    getUserDiscordBadgeData(memberRow.userId),
    getPremiumAccess(memberRow.userId),
    getBlogPostsForProfile(memberRow.id),
  ]);

  const profile = memberProfileToProfile(memberRow, badgeFlags, discordBadgeData, customBadges, premiumAccess.hasAccess);
  const themeClass = getThemeClass(profile.accentColor);

  return (
    <ProfileBackground profile={profile}>
      <div className={`relative z-10 w-full max-h-[calc(100vh-1.5rem)] overflow-auto max-w-2xl ${themeClass}`}>
        <article className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-sm bg-[color-mix(in_srgb,var(--surface)_95%,transparent)]">
          <div className="flex items-center gap-2 px-3 py-2 sm:px-4 border-b border-[var(--border)] bg-[var(--bg)]/90">
            <Link
              href={`/${slug}`}
              className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
            >
              ← {profile.name}
            </Link>
          </div>
          <div className="pt-4 px-4 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <Article size={24} weight="regular" className="text-[var(--accent)]" aria-hidden />
              <h1 className="text-lg font-semibold text-[var(--foreground)]">{profile.name}&apos;s blog</h1>
            </div>
            {posts.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No posts yet.</p>
            ) : (
              <ul className="space-y-3 list-none p-0 m-0">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/${slug}/blog/${post.id}`}
                      className="block rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/30 px-4 py-3 hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition-colors group"
                    >
                      <h2 className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)]">
                        {post.title}
                      </h2>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {formatDate(post.createdAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </div>
    </ProfileBackground>
  );
}

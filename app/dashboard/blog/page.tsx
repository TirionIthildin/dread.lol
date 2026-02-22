import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser, getOrCreateMemberProfile } from "@/lib/member-profiles";
import { getBillingSettings } from "@/lib/settings";
import { canUseDashboard } from "@/lib/dashboard-access";
import { getPremiumAccess } from "@/lib/premium-permissions";
import { getBlogPostsForProfile } from "@/lib/blog";
import { slugFromUsername } from "@/lib/slug";
import DashboardBlog from "@/app/dashboard/DashboardBlog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Manage your profile micro-blog",
  robots: "noindex, nofollow",
};

export default async function BlogPage() {
  const session = await getSession();
  if (!session) {
    redirect("/dashboard");
  }
  const [user, billing, premiumAccess] = await Promise.all([
    getOrCreateUser(session),
    getBillingSettings(),
    getPremiumAccess(session.sub),
  ]);
  if (!canUseDashboard(user, billing)) redirect("/dashboard");
  const slug = slugFromUsername(session.preferred_username ?? session.name ?? session.sub);
  const name = session.name ?? session.preferred_username ?? "Member";
  const profile = await getOrCreateMemberProfile(user.id, {
    name,
    slug,
    avatarUrl: session.picture ?? undefined,
  });
  const posts = await getBlogPostsForProfile(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Blog</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Write short posts in markdown. They appear on your profile at{" "}
          <Link href={`/${profile.slug}/blog`} className="text-[var(--accent)] hover:underline" target="_blank" rel="noopener noreferrer">
            /{profile.slug}/blog
          </Link>
          .
        </p>
      </div>
      <DashboardBlog
        profileSlug={profile.slug}
        initialPosts={posts}
        blogPremiumOnly={billing.blogPremiumOnly}
        hasPremiumAccess={premiumAccess.hasAccess}
      />
    </div>
  );
}

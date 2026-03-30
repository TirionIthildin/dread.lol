import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { getTemplateById, templateToProfile } from "@/lib/marketplace-templates";
import ProfileContent from "@/app/components/ProfileContent";
import ProfileBackground from "@/app/components/ProfileBackground";
import ProfileCursorEffect from "@/app/components/ProfileCursorEffect";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Template Preview",
  robots: "noindex, nofollow",
};

export default async function MarketplaceTemplatePreviewPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const user = session ? await getOrCreateUser(session) : null;
  const template = await getTemplateById(id);
  if (!template) notFound();

  const isCreator = template.creatorId === session?.sub;
  const isAdmin = user?.isAdmin ?? false;
  if (!isCreator && !isAdmin) notFound();

  const profile = templateToProfile(template);
  const needsCursorEffect = profile.cursorStyle === "glow" || profile.cursorStyle === "trail";
  const content = (
    <div className="relative">
      <div className="absolute top-2 right-2 z-20 rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-1.5 text-xs text-[var(--muted)]">
        Preview — {template.name}
      </div>
      <ProfileContent
        profile={profile}
        vouches={{ slug: "preview", count: 0, vouchedBy: [], mutualVouchers: [], currentUserHasVouched: false, canVouch: false }}
        similarProfiles={[]}
        mutualGuilds={[]}
        canReport={false}
        canSubmitReport={false}
      />
    </div>
  );

  return (
    <ProfileBackground profile={profile}>
      {needsCursorEffect ? (
        <ProfileCursorEffect cursorStyle={profile.cursorStyle} accentColor={profile.accentColor}>
          {content}
        </ProfileCursorEffect>
      ) : (
        content
      )}
    </ProfileBackground>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { getTemplateById } from "@/lib/marketplace-templates";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import MarketplaceApplyButton from "@/app/components/MarketplaceApplyButton";
import MarketplaceAdminPreviewLink from "@/app/components/MarketplaceAdminPreviewLink";
import MarketplaceFavoriteButton from "@/app/components/MarketplaceFavoriteButton";
import MarketplaceReportButton from "@/app/components/MarketplaceReportButton";
import { getTemplateFavoriteCounts, getFavoritedTemplateIds } from "@/lib/template-favorites";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const template = await getTemplateById(id);
  if (!template) return { title: "Template not found" };
  if (template.status !== "published") return { title: `${template.name} (draft) — Marketplace` };
  return {
    title: `${template.name} — Marketplace — ${SITE_NAME}`,
    description: template.description ?? `Profile template: ${template.name}`,
    openGraph: {
      title: `${template.name} — Marketplace — ${SITE_NAME}`,
      url: `${SITE_URL}/marketplace/${id}`,
    },
  };
}

export default async function MarketplaceTemplatePage({ params }: Props) {
  const { id } = await params;
  const [template, session] = await Promise.all([getTemplateById(id), getSession()]);
  const user = session ? await getOrCreateUser(session) : null;
  const isAdmin = user?.isAdmin ?? false;
  const isCreator = template?.creatorId === session?.sub;

  if (!template) notFound();
  if (template.status !== "published" && !isCreator && !isAdmin) notFound();

  const [favoriteCounts, favoritedIds] = await Promise.all([
    getTemplateFavoriteCounts([id]),
    session ? getFavoritedTemplateIds(session.sub, [id]) : Promise.resolve(new Set<string>()),
  ]);
  const favoriteCount = favoriteCounts.get(id) ?? 0;
  const favorited = favoritedIds.has(id);

  const previewUrl = template.previewUrl?.trim() || template.data.ogImageUrl || template.data.backgroundUrl;

  return (
    <div className="relative z-10 w-full max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-auto">
      <div className="rounded-xl border border-[var(--border)] shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden bg-[var(--surface)]/95">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <Link
            href="/marketplace"
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            ← Marketplace
          </Link>
        </div>
        <div className="p-4 space-y-4">
          {previewUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-[var(--bg)]/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">{template.name}</h1>
            {template.description && (
              <p className="text-sm text-[var(--muted)] mt-1">{template.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--muted)] flex-wrap">
            {template.status !== "published" && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-600 dark:text-amber-400">
                {template.status}
              </span>
            )}
            <span>{template.applyCount} applied</span>
            {template.creatorSlug ? (
              <Link href={`/${template.creatorSlug}`} className="hover:text-[var(--accent)]">
                by {template.creatorSlug}
              </Link>
            ) : null}
          </div>
          <div className="pt-2 flex flex-wrap gap-2 items-center">
            {template.status === "published" && (
              <MarketplaceApplyButton templateId={id} templateName={template.name} />
            )}
            {session && template.status === "published" && (
              <MarketplaceFavoriteButton
                templateId={id}
                initialFavorited={favorited}
                showCount
                favoriteCount={favoriteCount}
              />
            )}
            {session && template.status === "published" && !isCreator && (
              <MarketplaceReportButton templateId={id} />
            )}
            {isAdmin && (
              <MarketplaceAdminPreviewLink templateId={id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

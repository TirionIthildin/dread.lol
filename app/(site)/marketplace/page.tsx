import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { listPublishedTemplates } from "@/lib/marketplace-templates";
import { getTemplateFavoriteCounts, getFavoritedTemplateIds } from "@/lib/template-favorites";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import MarketplaceToolbar from "@/app/components/MarketplaceToolbar";
import MarketplaceFavoriteButton from "@/app/components/MarketplaceFavoriteButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Profile Marketplace — ${SITE_NAME}`,
  description: `Browse and apply community profile templates on ${SITE_NAME}`,
  openGraph: {
    title: `Profile Marketplace — ${SITE_NAME}`,
    url: `${SITE_URL}/marketplace`,
  },
};

function resolvePreviewUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith("/api/files/")) {
    return url; // Same-origin, will work
  }
  return url.startsWith("http") ? url : null;
}

type PageProps = { searchParams: Promise<{ q?: string; sort?: string }> };

export default async function MarketplacePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const sort = params.sort === "recent" ? "recent" : "applied";

  let items: Awaited<ReturnType<typeof listPublishedTemplates>>["items"] = [];
  let featured: Awaited<ReturnType<typeof listPublishedTemplates>>["featured"] = [];
  let total = 0;
  let error = false;
  try {
    const result = await listPublishedTemplates({ limit: 30, q, sort });
    items = result.items;
    featured = result.featured ?? [];
    total = result.total;
  } catch {
    error = true;
  }

  const session = await getSession();
  const allIds = [...items.map((i) => i.id), ...(featured?.map((i) => i.id) ?? [])];
  const uniqueIds = [...new Set(allIds)];
  const [favoriteCounts, favoritedIds] = await Promise.all([
    uniqueIds.length > 0 ? getTemplateFavoriteCounts(uniqueIds) : Promise.resolve(new Map<string, number>()),
    session && uniqueIds.length > 0 ? getFavoritedTemplateIds(session.sub, uniqueIds) : Promise.resolve(new Set<string>()),
  ]);

  const isEmpty = !error && items.length === 0;
  const hasQuery = Boolean(q?.trim());

  return (
    <div className="relative z-10 w-full max-w-4xl max-h-[calc(100vh-1.5rem)] overflow-auto">
      <div className="rounded-xl border border-[var(--border)] shadow-2xl shadow-black/50 backdrop-blur-sm overflow-hidden bg-[var(--surface)]/95">
        <div className="border-b border-[var(--border)] px-4 py-3 space-y-3">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Profile Marketplace</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Community templates you can apply to your profile
          </p>
          <Suspense fallback={null}>
            <MarketplaceToolbar />
          </Suspense>
        </div>
        <div className="p-4">
          {error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--muted)]">Failed to load templates. Please try again later.</p>
            </div>
          ) : isEmpty ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[var(--muted)]">
                {hasQuery
                  ? "No templates match your search. Try a different query."
                  : "No templates yet. Create one in the dashboard and publish it to the marketplace."}
              </p>
            </div>
          ) : (
            <>
              {featured.length > 0 && !hasQuery && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-[var(--muted)] mb-3">Featured</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {featured.map((t) => {
                      const previewUrl = resolvePreviewUrl(t.previewUrl) ?? t.data.ogImageUrl ?? t.data.backgroundUrl;
                      const creatorSlug = "creatorSlug" in t ? t.creatorSlug : null;
                      return (
                        <div
                          key={t.id}
                          className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 overflow-hidden"
                        >
                          <Link href={`/marketplace/${t.id}`} className="block">
                            <div className="aspect-video bg-[var(--bg)]/80 relative">
                              {previewUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-4xl">
                                  {t.name.charAt(0)}
                                </div>
                              )}
                              <span className="absolute top-2 right-2 rounded bg-[var(--accent)]/90 px-2 py-0.5 text-[10px] font-medium text-white">
                                Featured
                              </span>
                            </div>
                            <div className="p-3">
                              <h3 className="font-medium text-[var(--foreground)] truncate">{t.name}</h3>
                              {t.description && (
                                <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{t.description}</p>
                              )}
                            </div>
                          </Link>
                          <div className="px-3 pb-3 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                            <span>{t.applyCount} applied</span>
                            <div className="flex items-center gap-2">
                              {session && (
                                <MarketplaceFavoriteButton
                                  templateId={t.id}
                                  initialFavorited={favoritedIds.has(t.id)}
                                  showCount
                                  favoriteCount={favoriteCounts.get(t.id) ?? 0}
                                />
                              )}
                              {creatorSlug ? (
                                <Link href={`/${creatorSlug}`} className="hover:text-[var(--accent)] truncate">
                                  by {creatorSlug}
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {featured.length > 0 && !hasQuery && (
                <h2 className="text-sm font-medium text-[var(--muted)] mb-3">All templates</h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const featuredIds = new Set(featured.map((f) => f.id));
                const displayItems = featured.length > 0 && !hasQuery
                  ? items.filter((t) => !featuredIds.has(t.id))
                  : items;
                return displayItems.map((t) => {
                const previewUrl = resolvePreviewUrl(t.previewUrl) ?? t.data.ogImageUrl ?? t.data.backgroundUrl;
                const creatorSlug = "creatorSlug" in t ? t.creatorSlug : null;
                return (
                  <div
                    key={t.id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/30 hover:border-[var(--accent)]/50 hover:bg-[var(--bg)]/50 transition-colors overflow-hidden"
                  >
                    <Link href={`/marketplace/${t.id}`} className="block">
                      <div className="aspect-video bg-[var(--bg)]/80 relative">
                        {previewUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={previewUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-4xl">
                            {t.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-[var(--foreground)] truncate">{t.name}</h3>
                        {t.description && (
                          <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{t.description}</p>
                        )}
                      </div>
                    </Link>
                    <div className="px-3 pb-3 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                      <span>{t.applyCount} applied</span>
                      <div className="flex items-center gap-2">
                        {session && (
                          <MarketplaceFavoriteButton
                            templateId={t.id}
                            initialFavorited={favoritedIds.has(t.id)}
                            showCount
                            favoriteCount={favoriteCounts.get(t.id) ?? 0}
                          />
                        )}
                        {creatorSlug ? (
                          <Link
                            href={`/${creatorSlug}`}
                            className="hover:text-[var(--accent)] truncate"
                          >
                            by {creatorSlug}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              });
              })()}
            </div>
            </>
          )}
        </div>
        <div className="border-t border-[var(--border)] px-4 py-2 flex justify-between items-center">
          <Link
            href="/"
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            ← Back to home
          </Link>
          <div className="flex items-center gap-3">
            {session && (
              <Link
                href="/dashboard/marketplace/favorites"
                className="text-xs text-[var(--accent)] hover:underline"
              >
                My favorites
              </Link>
            )}
            <Link
              href="/dashboard/marketplace"
              className="text-xs text-[var(--accent)] hover:underline"
            >
              My templates
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

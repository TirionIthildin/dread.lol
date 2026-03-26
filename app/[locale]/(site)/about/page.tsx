import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, SITE_OG_IMAGE } from "@/lib/site";
import { languageAlternates, ogLocaleForUiLocale } from "@/lib/i18n-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const title = t("metadataTitle", { siteName: SITE_NAME });
  const description = t("metadataDescription", { siteName: SITE_NAME });
  const ogLoc = ogLocaleForUiLocale(locale);
  return {
    title,
    description,
    robots: "index, follow",
    alternates: languageAlternates("/about"),
    openGraph: {
      type: "website",
      url: `${SITE_URL}/about`,
      locale: ogLoc,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: description }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const tc = await getTranslations({ locale, namespace: "common" });

  return (
    <article className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs text-[var(--muted)] mb-6">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            {tc("backHome")}
          </Link>
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          {t("title", { siteName: SITE_NAME })}
        </h1>
        <p className="text-sm text-[var(--muted)] mb-6">{t("subtitle", { siteDescription: SITE_DESCRIPTION })}</p>

        <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)] space-y-4">
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("whatItIs")}</h2>
            <p className="text-sm text-[var(--muted)]">
              {t("whatItIsBody", { siteName: SITE_NAME })}
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("whatYouCanDo")}</h2>
            <ul className="text-sm text-[var(--muted)] list-disc pl-5 space-y-1.5">
              <li>
                {t.rich("marketplaceItem", {
                  marketplace: (chunks) => (
                    <Link href="/marketplace" className="text-[var(--accent)] hover:underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </li>
              <li>
                {t.rich("galleryBlogItem", {
                  code: (chunks) => (
                    <code className="text-xs text-[var(--foreground)]">{chunks}</code>
                  ),
                })}
              </li>
              <li>{t("dashboardItem")}</li>
              <li>
                {t.rich("trendingLeaderboardItem", {
                  trending: (chunks) => (
                    <Link href="/trending" className="text-[var(--accent)] hover:underline">
                      {chunks}
                    </Link>
                  ),
                  leaderboard: (chunks) => (
                    <Link href="/dashboard/leaderboard" className="text-[var(--accent)] hover:underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("premium")}</h2>
            <p className="text-sm text-[var(--muted)]">
              {t.rich("premiumBody", {
                premium: (chunks) => (
                  <Link href="/dashboard/premium" className="text-[var(--accent)] hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("privacy")}</h2>
            <p className="text-sm text-[var(--muted)]">
              {t.rich("privacyBody", {
                privacyPolicy: (chunks) => (
                  <Link href="/privacy" className="text-[var(--accent)] hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("identityRoadmap")}</h2>
            <p className="text-sm text-[var(--muted)] mb-3">
              <strong className="text-[var(--foreground)] font-medium">{t("discordLocal")}</strong>{" "}
              {t("discordLocalBody")}
            </p>
            <p className="text-sm text-[var(--muted)] mb-3">
              <strong className="text-[var(--foreground)] font-medium">{t("customDomains")}</strong>{" "}
              {t.rich("customDomainsBody", {
                strong: (chunks) => <strong className="text-[var(--foreground)] font-medium">{chunks}</strong>,
              })}
            </p>
            <p className="text-sm text-[var(--muted)]">
              <strong className="text-[var(--foreground)] font-medium">{t("api")}</strong>{" "}
              {t.rich("apiBody", {
                docs: (chunks) => (
                  <Link href="/docs" className="text-[var(--accent)] hover:underline">
                    {chunks}
                  </Link>
                ),
                docsApi: (chunks) => (
                  <Link href="/docs/api" className="text-[var(--accent)] hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("help")}</h2>
            <p className="text-sm text-[var(--muted)]">{t("helpBody", { siteName: SITE_NAME })}</p>
          </section>
        </div>
      </div>
    </article>
  );
}

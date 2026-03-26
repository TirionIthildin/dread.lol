import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE_NAME, SITE_URL, SITE_OG_IMAGE } from "@/lib/site";
import { languageAlternates, ogLocaleForUiLocale } from "@/lib/i18n-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  const title = t("metadataTitle", { siteName: SITE_NAME });
  const description = t("metadataDescription");
  const ogLoc = ogLocaleForUiLocale(locale);
  return {
    title,
    description,
    robots: "index, follow",
    alternates: languageAlternates("/terms"),
    openGraph: {
      type: "website",
      url: `${SITE_URL}/terms`,
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

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const dateLocale = locale === "es" ? "es" : "en-US";
  const lastUpdated = new Date().toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-xs text-[var(--muted)] mb-6">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            {tc("backHome")}
          </Link>
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-4">{t("title")}</h1>
        <p className="text-sm text-[var(--muted)] mb-4">{t("lastUpdated", { date: lastUpdated })}</p>
        <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)] space-y-4">
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("acceptance")}</h2>
            <p className="text-sm text-[var(--muted)]">{t("acceptanceBody", { siteName: SITE_NAME })}</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("useOfService")}</h2>
            <p className="text-sm text-[var(--muted)]">{t("useOfServiceBody")}</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("accountAccess")}</h2>
            <p className="text-sm text-[var(--muted)]">{t("accountAccessBody")}</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("changes")}</h2>
            <p className="text-sm text-[var(--muted)]">{t("changesBody")}</p>
          </section>
          <section>
            <h2 className="text-base font-medium text-[var(--foreground)] mt-6 mb-2">{t("contact")}</h2>
            <p className="text-sm text-[var(--muted)]">{t("contactBody")}</p>
          </section>
        </div>
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import FeatureUpdates from "@/app/components/FeatureUpdates";
import HomePageContent from "@/app/components/HomePageContent";
import LeaderboardWidget from "@/app/components/LeaderboardWidget";
import SignInWidget from "@/app/components/SignInWidget";
import SiteNoticeBanner from "@/app/components/SiteNoticeBanner";
import TerminalWindow from "@/app/components/TerminalWindow";
import { getSiteNoticeSettings } from "@/lib/site-notice-settings";
import { getSiteNoticeDisplay } from "@/lib/site-notice-settings-shared";
import { SITE_URL, SITE_NAME, SITE_OG_IMAGE } from "@/lib/site";
import { getTranslations } from "next-intl/server";
import { languageAlternates, ogLocaleForUiLocale } from "@/lib/i18n-seo";

/** Rendered at request time — LeaderboardWidget requires MongoDB. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const description = t("metadataDescription");
  const ogLoc = ogLocaleForUiLocale(locale);
  return {
    title: SITE_NAME,
    description,
    alternates: languageAlternates("/"),
    openGraph: {
      type: "website",
      url: SITE_URL,
      locale: ogLoc,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: description }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default async function Home() {
  const noticeSettings = await getSiteNoticeSettings();
  const homeNotice = getSiteNoticeDisplay("home", noticeSettings);
  const t = await getTranslations("home");

  return (
    <div className="w-full min-w-0 max-w-6xl max-h-[calc(100vh-1.5rem)] overflow-auto flex flex-col gap-4 px-4 py-2">
      {homeNotice.show ? (
        <SiteNoticeBanner message={homeNotice.message} variant={homeNotice.variant} />
      ) : null}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 flex-1 min-h-0">
        <div className="order-2 lg:order-1 w-full lg:w-auto lg:min-w-0 lg:max-w-[240px] shrink-0 flex flex-col gap-6">
          <TerminalWindow title={t("terminalSignInTitle")} className="animate-fade-in">
            <SignInWidget />
          </TerminalWindow>
          <TerminalWindow title={t("terminalLeaderboardTitle")} className="animate-fade-in">
            <LeaderboardWidget />
          </TerminalWindow>
        </div>
        <div className="order-1 lg:order-2 flex-1 min-w-0 flex flex-col items-center w-full lg:max-w-[28rem]">
          <HomePageContent />
        </div>
        <div className="order-3 w-full lg:w-auto lg:min-w-0 lg:max-w-[320px] shrink-0">
          <FeatureUpdates />
        </div>
      </div>
    </div>
  );
}

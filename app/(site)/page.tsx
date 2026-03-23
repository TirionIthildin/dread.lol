import type { Metadata } from "next";
import FeatureUpdates from "@/app/components/FeatureUpdates";
import HomePageContent from "@/app/components/HomePageContent";
import LeaderboardWidget from "@/app/components/LeaderboardWidget";
import SignInWidget from "@/app/components/SignInWidget";
import TerminalWindow from "@/app/components/TerminalWindow";
import { SITE_URL, SITE_NAME, SITE_OG_IMAGE } from "@/lib/site";

/** Richer than SITE_DESCRIPTION for search and social previews on the landing page only. */
const HOME_DESCRIPTION =
  "Terminal-styled member profiles for Discord: marketplace templates, gallery, blog, analytics, vouches, and Premium add-ons. Sign in with Discord.";

/** Rendered at request time — LeaderboardWidget requires MongoDB. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: HOME_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
    images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: HOME_DESCRIPTION }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
};

export default function Home() {
  return (
    <div className="w-full min-w-0 max-w-6xl max-h-[calc(100vh-1.5rem)] overflow-auto flex flex-col lg:flex-row items-center justify-center gap-6 px-4">
      <div className="order-2 lg:order-1 w-full lg:w-auto lg:min-w-0 lg:max-w-[240px] shrink-0 flex flex-col gap-6">
        <TerminalWindow title="user@dread:~ — sign in" className="animate-fade-in">
          <SignInWidget />
        </TerminalWindow>
        <TerminalWindow title="user@dread:~ — leaderboard" className="animate-fade-in">
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
  );
}

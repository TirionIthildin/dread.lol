import type { Metadata } from "next";
import HomePageContent from "@/app/components/HomePageContent";
import LeaderboardWidget from "@/app/components/LeaderboardWidget";
import SignInWidget from "@/app/components/SignInWidget";
import TerminalWindow from "@/app/components/TerminalWindow";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: SITE_DESCRIPTION }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
};

export default function Home() {
  return (
    <div className="w-full max-w-6xl max-h-[calc(100vh-1.5rem)] overflow-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 px-4">
      <div className="order-2 md:order-1 w-full md:w-auto shrink-0">
        <TerminalWindow title="user@dread:~ — sign in" className="animate-fade-in">
          <SignInWidget />
        </TerminalWindow>
      </div>
      <div className="order-1 md:order-2 flex-1 md:min-w-[28rem] min-w-0 flex flex-col items-center w-full md:max-w-2xl">
        <HomePageContent />
      </div>
      <div className="order-3 w-full md:w-auto shrink-0">
        <TerminalWindow title="user@dread:~ — leaderboard" className="animate-fade-in">
          <LeaderboardWidget />
        </TerminalWindow>
      </div>
    </div>
  );
}

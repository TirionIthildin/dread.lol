"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import TerminalWindow from "@/app/components/TerminalWindow";
import WelcomeTerminal from "@/app/components/WelcomeTerminal";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import { routing } from "@/i18n/routing";

export default function HomePageContent() {
  const t = useTranslations("home");
  const locale = useLocale();
  const otherLocale = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  return (
    <>
      <h1 className="sr-only">{t("srTitle", { siteName: SITE_NAME, siteDescription: SITE_DESCRIPTION })}</h1>
      <p className="mb-3 max-w-md text-center text-[11px] leading-snug text-[var(--muted)]">
        {t("intro")}{" "}
        <Link href="/about" className="text-[var(--accent)] hover:underline">
          {t("footerAbout")}
        </Link>
        <span className="mx-1 text-[var(--muted)]/60">·</span>
        <Link href="/dashboard/premium" className="text-[var(--accent)] hover:underline">
          {t("footerPremium")}
        </Link>
        <span className="mx-1 text-[var(--muted)]/60">·</span>
        <Link href="/docs" className="text-[var(--accent)] hover:underline">
          {t("footerDocs")}
        </Link>
        <span className="mx-1 text-[var(--muted)]/60">·</span>
        <Link href="/changelog" className="text-[var(--accent)] hover:underline">
          {t("footerChangelog")}
        </Link>
      </p>
      <TerminalWindow title={t("terminalWelcomeTitle")} className="animate-fade-in hover-lift">
        <WelcomeTerminal />
      </TerminalWindow>
      <footer className="mt-4 pb-2 text-[10px] text-[var(--muted)] flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
        <Link href="/about" className="hover:text-[var(--accent)] hover:underline">
          {t("footerAbout")}
        </Link>
        <span>·</span>
        <Link href="/dashboard/leaderboard" className="hover:text-[var(--accent)] hover:underline">
          {t("footerLeaderboard")}
        </Link>
        <span>·</span>
        <Link href="/trending" className="hover:text-[var(--accent)] hover:underline">
          {t("footerTrending")}
        </Link>
        <span>·</span>
        <Link href="/marketplace" className="hover:text-[var(--accent)] hover:underline">
          {t("footerMarketplace")}
        </Link>
        <span>·</span>
        <Link href="/docs" className="hover:text-[var(--accent)] hover:underline">
          {t("footerDocs")}
        </Link>
        <span>·</span>
        <Link href="/changelog" className="hover:text-[var(--accent)] hover:underline">
          {t("footerChangelog")}
        </Link>
        <span>·</span>
        <Link href="/status" className="hover:text-[var(--accent)] hover:underline">
          {t("footerStatus")}
        </Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-[var(--accent)] hover:underline">
          {t("footerPrivacy")}
        </Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-[var(--accent)] hover:underline">
          {t("footerTerms")}
        </Link>
        <span className="mx-1 text-[var(--muted)]/50" aria-hidden>
          |
        </span>
        <Link href="/" locale={otherLocale} className="hover:text-[var(--accent)] hover:underline">
          {otherLocale === "es" ? t("localeSwitcherEs") : t("localeSwitcherEn")}
        </Link>
      </footer>
    </>
  );
}

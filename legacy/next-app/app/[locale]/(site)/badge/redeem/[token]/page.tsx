import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { getLinkByToken } from "@/lib/badge-redemption";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import BadgeRedeemClient from "./BadgeRedeemClient";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const link = await getLinkByToken(token);
  const title = link.valid
    ? `Redeem badge${link.badgeLabel ? `: ${link.badgeLabel}` : ""}`
    : "Invalid link";
  return {
    title: `${title} — ${SITE_NAME}`,
    description: link.valid ? "Claim this badge and add it to your profile." : "This redemption link is invalid or has already been used.",
    alternates: { canonical: `${SITE_URL}/badge/redeem/${token}` },
    robots: { index: false, follow: false },
  };
}

export default async function BadgeRedeemPage({ params }: Props) {
  const { token } = await params;
  const session = await getSession();
  const link = await getLinkByToken(token, session?.sub ?? undefined);

  if (!link.valid) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 text-center">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-8">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Invalid or expired link
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {link.error ?? "This redemption link doesn&apos;t exist or has already been used."}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <BadgeRedeemClient
      token={token}
      badgeLabel={link.badgeLabel}
      isLoggedIn={!!session}
      alreadyRedeemed={link.alreadyRedeemed}
    />
  );
}

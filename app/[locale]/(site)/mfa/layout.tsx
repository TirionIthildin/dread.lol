import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Two-factor sign-in — ${SITE_NAME}`,
  description: `Complete two-factor authentication for ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/mfa` },
};

export default function MfaLayout({ children }: { children: React.ReactNode }) {
  return children;
}

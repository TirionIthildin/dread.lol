import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { JetBrains_Mono, Fira_Code, Space_Mono, Inter } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";
import "../globals.css";
import PwaRegistration from "@/app/components/PwaRegistration";
import { routing } from "@/i18n/routing";
import { ogLocaleForUiLocale } from "@/lib/i18n-seo";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_OG_IMAGE } from "@/lib/site";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fira-code",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#08090a",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "rootLayout" });
  const description = t("jsonLdDescription", { siteDescription: SITE_DESCRIPTION });
  const ogLoc = ogLocaleForUiLocale(locale);
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    openGraph: {
      type: "website",
      locale: ogLoc,
      url: SITE_URL,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "rootLayout" });
  const jsonLdDescription = t("jsonLdDescription", { siteDescription: SITE_DESCRIPTION });
  const inLanguage = locale === "es" ? "es" : "en-US";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: jsonLdDescription,
        inLanguage,
      },
    ],
  };

  return (
    <html
      lang={locale}
      className={`dark ${jetbrainsMono.variable} ${firaCode.variable} ${spaceMono.variable} ${inter.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://cdn.discordapp.com" />
        <link rel="dns-prefetch" href="https://cdn.discordapp.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased font-mono">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Toaster richColors position="top-center" theme="dark" />
          <div className="relative z-10">{children}</div>
          <PwaRegistration />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

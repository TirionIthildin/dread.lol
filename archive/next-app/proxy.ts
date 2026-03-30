import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { getProfileSlugFromHost } from "@/lib/request";
import { rewriteSubdomainPath } from "@/lib/subdomain-rewrite";

const handleI18n = createMiddleware(routing);

/** Skip i18n / subdomain rewrite for API, static assets, and internal paths. */
const SKIP_PATHS = ["/api", "/_next", "/favicon", "/logo", "/robots", "/sitemap"];

function shouldSkip(pathname: string): boolean {
  return SKIP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  const slug = getProfileSlugFromHost(request.headers);
  if (!slug) {
    return handleI18n(request);
  }

  const url = request.nextUrl.clone();
  url.pathname = rewriteSubdomainPath(slug, pathname);
  return handleI18n(new NextRequest(url, request));
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

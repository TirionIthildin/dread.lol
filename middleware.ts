import { NextRequest, NextResponse } from "next/server";
import { getProfileSlugFromHost } from "@/lib/request";
import { rewriteSubdomainPath } from "@/lib/subdomain-rewrite";

/** Skip rewriting for API, static assets, and internal Next.js paths. */
const SKIP_PATHS = ["/api", "/_next", "/favicon", "/logo", "/robots", "/sitemap"];

function shouldSkip(pathname: string): boolean {
  return SKIP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (shouldSkip(pathname)) return NextResponse.next();

  const slug = getProfileSlugFromHost(request.headers);
  if (!slug) return NextResponse.next();

  const newPath = rewriteSubdomainPath(slug, pathname);
  const url = request.nextUrl.clone();
  url.pathname = newPath;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and api.
     * Subdomain rewrite only runs for (site) paths.
     */
    "/((?!api|_next/static|_next/image|favicon|logo|robots|sitemap).*)",
  ],
};

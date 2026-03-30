import { NextRequest, NextResponse } from "next/server";
import { getBaseDomain, getCanonicalOrigin } from "@/lib/site";

/**
 * OAuth and auth flows must start on the apex origin (e.g. https://dread.lol). If the user
 * opens https://dashboard.dread.lol/api/auth/discord, the Discord authorize UI can mis-resolve
 * relative `/assets/...` URLs against the dashboard host and load HTML instead of scripts.
 */
export function redirectAuthToCanonicalOrigin(request: NextRequest): NextResponse | null {
  const canonicalBase = getCanonicalOrigin().replace(/\/$/, "");
  let canonicalOrigin: string;
  try {
    canonicalOrigin = new URL(canonicalBase).origin;
  } catch {
    return null;
  }
  if (request.nextUrl.origin === canonicalOrigin) return null;

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const base = getBaseDomain().toLowerCase();
  if (!host || !base) return null;
  if (host === base || host === `www.${base}`) return null;
  if (!host.endsWith(`.${base}`)) return null;

  const pathAndQuery = request.nextUrl.pathname + request.nextUrl.search;
  const target = new URL(pathAndQuery, `${canonicalBase}/`);
  return NextResponse.redirect(target, 307);
}

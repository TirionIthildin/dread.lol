import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasUserFavorited } from "@/lib/template-favorites";

/** GET: Check if current user has favorited templates. Query: templateIds=id1,id2 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ favorited: [] });
  }

  const templateIds = request.nextUrl.searchParams.get("templateIds")?.split(",").filter(Boolean) ?? [];
  if (templateIds.length === 0) {
    return NextResponse.json({ favorited: [] });
  }

  const favorited: string[] = [];
  for (const id of templateIds.slice(0, 50)) {
    if (await hasUserFavorited(session.sub, id.trim())) {
      favorited.push(id.trim());
    }
  }
  return NextResponse.json({ favorited });
}

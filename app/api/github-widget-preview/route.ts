import { NextRequest, NextResponse } from "next/server";
import { getGithubWidgetData } from "@/lib/github-widgets";

/**
 * GET ?login=octocat&widgets=lastPush,publicRepos — cached GitHub stats for dashboard preview.
 */
export async function GET(req: NextRequest) {
  const login = req.nextUrl.searchParams.get("login");
  const widgets = req.nextUrl.searchParams.get("widgets");
  const data = await getGithubWidgetData(login ?? undefined, widgets ?? undefined);
  if (!data) return NextResponse.json(null);
  return NextResponse.json(data);
}

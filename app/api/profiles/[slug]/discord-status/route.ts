import { NextResponse } from "next/server";
import { getMemberProfileBySlug } from "@/lib/member-profiles";
import { getDiscordPresence } from "@/lib/discord-presence";

type Params = { params: Promise<{ slug: string }> };

/** GET: return cached Discord presence (status + activities) for a profile by slug. Public. */
export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const presence = await getDiscordPresence(profile.userId);
  if (!presence) {
    return NextResponse.json({ presence: null });
  }
  return NextResponse.json({ presence });
}

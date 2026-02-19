import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getMemberProfileBySlug,
  setProfileReaction,
  removeProfileReaction,
  getProfileReactions,
  getCurrentUserReaction,
} from "@/lib/member-profiles";

type Params = { params: Promise<{ slug: string }> };

/** POST: add or change reaction. Body: { emoji: "👍" | "🔥" | ... } */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to react." }, { status: 401 });
  }
  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  let body: { emoji?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const emoji = body.emoji?.trim();
  if (!emoji) {
    return NextResponse.json({ error: "Missing emoji" }, { status: 400 });
  }
  try {
    const { reactions, userReaction } = await setProfileReaction(profile.id, session.sub, emoji);
    return NextResponse.json({ ok: true, reactions, userReaction });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** DELETE: remove reaction */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to remove a reaction." }, { status: 401 });
  }
  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const { reactions } = await removeProfileReaction(profile.id, session.sub);
  return NextResponse.json({ ok: true, reactions, userReaction: null });
}

/** GET: reactions and current user's reaction (if any) */
export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const session = await getSession();
  const [reactions, userReaction] = await Promise.all([
    getProfileReactions(profile.id),
    session ? getCurrentUserReaction(profile.id, session.sub) : Promise.resolve(null),
  ]);
  return NextResponse.json({ reactions, userReaction });
}

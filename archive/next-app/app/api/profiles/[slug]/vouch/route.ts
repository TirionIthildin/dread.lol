import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getMemberProfileBySlug,
  addVouch,
  removeVouch,
  hasUserVouched,
  getVouchesForProfile,
} from "@/lib/member-profiles";

type Params = { params: Promise<{ slug: string }> };

/** POST: add vouch (requires login; approved status not required). */
export async function POST(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to vouch." }, { status: 401 });
  }
  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  if (profile.userId === session.sub) {
    return NextResponse.json({ error: "You cannot vouch for yourself." }, { status: 400 });
  }
  const added = await addVouch(profile.id, session.sub);
  if (!added) {
    return NextResponse.json({ error: "Already vouched for this profile." }, { status: 400 });
  }
  const { count, vouchedBy } = await getVouchesForProfile(profile.id);
  return NextResponse.json({ ok: true, count, vouchedBy, hasVouched: true });
}

/** DELETE: remove vouch (requires login). */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to remove a vouch." }, { status: 401 });
  }
  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  await removeVouch(profile.id, session.sub);
  const { count, vouchedBy } = await getVouchesForProfile(profile.id);
  return NextResponse.json({ ok: true, count, vouchedBy, hasVouched: false });
}

/** GET: return vouch count, list, and whether current user has vouched (no login required for read). */
export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const profile = await getMemberProfileBySlug(slug);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const session = await getSession();
  const [vouchesData, hasVouched] = await Promise.all([
    getVouchesForProfile(profile.id),
    session ? hasUserVouched(profile.id, session.sub) : Promise.resolve(false),
  ]);
  return NextResponse.json({
    count: vouchesData.count,
    vouchedBy: vouchesData.vouchedBy,
    hasVouched,
    canVouch: session != null && session.sub !== profile.userId,
  });
}

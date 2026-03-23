import { NextResponse } from "next/server";
import { findUserById } from "@/lib/auth/local-account";
import { requireSession } from "@/lib/auth/require-session";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const user = await findUserById(auth.session.sub);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    enabled: Boolean(user.totpEnabled),
    backupCodesRemaining: user.totpBackupCodesHash?.length ?? 0,
  });
}

import { NextResponse } from "next/server";
import { requireStaff } from "@/app/[locale]/dashboard/actions";
import { getDiscordBotStats } from "@/lib/discord-bot-stats";

/** GET: Discord presence bot health + Valkey key counts (staff only). */
export async function GET() {
  const err = await requireStaff();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const stats = await getDiscordBotStats();
  return NextResponse.json({ stats });
}

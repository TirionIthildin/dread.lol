import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/dashboard/actions";
import { getPendingUsersListPaginated } from "@/lib/member-profiles";

export async function GET(request: Request) {
  const err = await requireAdmin();
  if (err) {
    return NextResponse.json({ error: err }, { status: err === "Not signed in" ? 401 : 403 });
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const { items } = await getPendingUsersListPaginated({
    search: q || undefined,
    page: 1,
    limit: 100,
  });
  return NextResponse.json({ pending: items });
}

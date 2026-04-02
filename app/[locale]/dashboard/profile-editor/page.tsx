import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import { getSession } from "@/lib/auth/session";
import { getOrCreateUser } from "@/lib/member-profiles";
import { canUseDashboard } from "@/lib/dashboard-access";
import DashboardMyProfile from "@/app/[locale]/dashboard/DashboardMyProfile";
import { PolarSuccessHandler } from "@/app/[locale]/dashboard/PolarSuccessHandler";
import { LocalPasskeyEnroll } from "@/app/[locale]/dashboard/LocalPasskeyEnroll";
import { loadProfileEditorPageData } from "@/app/[locale]/dashboard/profile-editor/loadProfileEditorPageData";

export const metadata: Metadata = {
  title: "Profile editor",
  description: `Edit your public profile for ${SITE_NAME}`,
  robots: "noindex, nofollow",
};

async function ProfileEditorContent({ session }: { session: NonNullable<Awaited<ReturnType<typeof getSession>>> }) {
  const result = await loadProfileEditorPageData(session);
  if (!result.ok) {
    return (
      <div
        className="rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]"
        role="alert"
      >
        <p className="font-medium">Database not available</p>
        <p className="mt-1 text-[var(--muted)]">
          Start MongoDB (e.g. <code className="rounded bg-[var(--surface)] px-1">docker compose up -d</code>) and run:
        </p>
        <p className="mt-2 font-mono text-xs">npm run db:migrate-prod</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Ensure DATABASE_URL points to MongoDB (e.g. mongodb://dread:dread@localhost:27017/dread?authSource=admin).
        </p>
      </div>
    );
  }
  return (
    <div className="-my-4 flex min-h-0 flex-1 flex-col md:-my-6">
      <DashboardMyProfile {...result.props} layoutVariant="fullPage" externalSectionNav />
    </div>
  );
}

export default async function ProfileEditorPage() {
  const session = await getSession();
  if (!session) {
    redirect("/dashboard");
  }
  const user = await getOrCreateUser(session);
  if (!canUseDashboard(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <PolarSuccessHandler />
      </Suspense>
      {session.auth_provider === "local" ? <LocalPasskeyEnroll /> : null}
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] flex-1 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 text-sm text-[var(--muted)]">
            Loading profile editor…
          </div>
        }
      >
        <ProfileEditorContent session={session} />
      </Suspense>
    </div>
  );
}

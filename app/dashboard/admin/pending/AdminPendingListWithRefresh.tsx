"use client";

import { useRouter } from "next/navigation";
import AdminPendingList, { type PendingUser } from "@/app/dashboard/AdminPendingList";

type Props = { pending: PendingUser[] };

export default function AdminPendingListWithRefresh({ pending }: Props) {
  const router = useRouter();
  return <AdminPendingList pending={pending} onApproved={() => router.refresh()} />;
}

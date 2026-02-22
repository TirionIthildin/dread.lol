/**
 * Dashboard access: approved or admin.
 */
import type { UserWithApproval } from "@/lib/member-profiles";

export function canUseDashboard(user: UserWithApproval | null): boolean {
  if (!user) return false;
  return user.approved || user.isAdmin;
}

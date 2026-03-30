/**
 * Dashboard access: any signed-in user.
 * Open signup – no approval required.
 */
import type { UserWithApproval } from "@/lib/member-profiles";

export function canUseDashboard(user: UserWithApproval | null): boolean {
  return !!user;
}

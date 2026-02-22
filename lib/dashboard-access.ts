/**
 * Dashboard access: approved, admin, or within Basic trial.
 */
import type { BillingSettings } from "@/lib/settings";
import type { UserWithApproval } from "@/lib/member-profiles";

export function isWithinBasicTrial(createdAt: Date | undefined, trialDays: number): boolean {
  if (!createdAt || trialDays <= 0) return false;
  const cutoff = new Date(createdAt);
  cutoff.setDate(cutoff.getDate() + trialDays);
  return new Date() < cutoff;
}

export function canUseDashboard(
  user: UserWithApproval | null,
  billing: BillingSettings
): boolean {
  if (!user) return false;
  if (user.approved || user.isAdmin) return true;
  return (
    billing.basicEnabled &&
    billing.basicTrialDays > 0 &&
    isWithinBasicTrial(user.createdAt, billing.basicTrialDays)
  );
}

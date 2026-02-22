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

/** Days left in Basic trial. 0 if expired or no trial. */
export function getBasicTrialDaysRemaining(createdAt: Date | undefined, trialDays: number): number {
  if (!createdAt || trialDays <= 0) return 0;
  if (!isWithinBasicTrial(createdAt, trialDays)) return 0;
  const cutoff = new Date(createdAt);
  cutoff.setDate(cutoff.getDate() + trialDays);
  const now = new Date();
  const msLeft = cutoff.getTime() - now.getTime();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

/** Trial end date. Undefined if no trial. */
export function getBasicTrialEndDate(createdAt: Date | undefined, trialDays: number): Date | undefined {
  if (!createdAt || trialDays <= 0) return undefined;
  const cutoff = new Date(createdAt);
  cutoff.setDate(cutoff.getDate() + trialDays);
  return cutoff;
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

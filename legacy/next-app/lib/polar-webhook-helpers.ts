/**
 * Pure helpers for Polar webhook payloads (external customer id resolution).
 */

/** Resolve Discord user id (or other external id) from subscription/order webhook payload. */
export function getPolarExternalId(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const r = obj as Record<string, unknown>;
  const customer = r.customer as Record<string, unknown> | undefined;
  const v =
    customer?.external_id ??
    customer?.externalId ??
    r.customer_external_id;
  return typeof v === "string" ? v : null;
}

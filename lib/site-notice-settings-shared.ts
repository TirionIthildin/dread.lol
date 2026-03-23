/**
 * Client-safe site notice types and helpers (no MongoDB).
 * Server persistence lives in `site-notice-settings.ts`.
 */

export const SITE_NOTICE_MAX_MESSAGE_LENGTH = 2000;

export type SiteNoticeVariant = "info" | "warning" | "critical";

export interface SiteNoticeSettings {
  enabled: boolean;
  message: string;
  showOnHome: boolean;
  showOnDashboard: boolean;
  variant: SiteNoticeVariant;
}

export interface SiteNoticeDisplay {
  show: boolean;
  message: string;
  variant: SiteNoticeVariant;
}

const VARIANTS: readonly SiteNoticeVariant[] = ["info", "warning", "critical"];

export function parseSiteNoticeVariant(raw: unknown): SiteNoticeVariant {
  if (typeof raw === "string" && (VARIANTS as readonly string[]).includes(raw)) {
    return raw as SiteNoticeVariant;
  }
  return "info";
}

/** Pure normalization for tests and API validation. */
export function normalizeSiteNoticeFromDb(input: {
  enabled?: unknown;
  message?: unknown;
  showOnHome?: unknown;
  showOnDashboard?: unknown;
  variant?: unknown;
}): SiteNoticeSettings {
  const enabled = input.enabled !== undefined && input.enabled !== null ? Boolean(input.enabled) : false;
  const rawMsg = typeof input.message === "string" ? input.message : "";
  const message = rawMsg.trim().slice(0, SITE_NOTICE_MAX_MESSAGE_LENGTH);
  const showOnHome =
    input.showOnHome !== undefined && input.showOnHome !== null ? Boolean(input.showOnHome) : false;
  const showOnDashboard =
    input.showOnDashboard !== undefined && input.showOnDashboard !== null
      ? Boolean(input.showOnDashboard)
      : false;
  const variant = parseSiteNoticeVariant(input.variant);

  return {
    enabled,
    message,
    showOnHome,
    showOnDashboard,
    variant,
  };
}

export function getSiteNoticeDisplay(
  placement: "home" | "dashboard",
  settings: SiteNoticeSettings
): SiteNoticeDisplay {
  const placementOk =
    placement === "home" ? settings.showOnHome : settings.showOnDashboard;
  const show = Boolean(settings.enabled && placementOk && settings.message.length > 0);
  return {
    show,
    message: settings.message,
    variant: settings.variant,
  };
}

export type SiteNoticePatchInput = {
  enabled?: boolean;
  message?: string;
  showOnHome?: boolean;
  showOnDashboard?: boolean;
  variant?: SiteNoticeVariant;
};

export function validateSiteNoticePatch(
  body: unknown
): { ok: true; patch: SiteNoticePatchInput } | { ok: false; error: string } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid JSON body" };
  }
  const o = body as Record<string, unknown>;
  const patch: SiteNoticePatchInput = {};

  if ("enabled" in o) {
    if (typeof o.enabled !== "boolean") return { ok: false, error: "enabled must be a boolean" };
    patch.enabled = o.enabled;
  }
  if ("message" in o) {
    if (typeof o.message !== "string") return { ok: false, error: "message must be a string" };
    patch.message = o.message.trim().slice(0, SITE_NOTICE_MAX_MESSAGE_LENGTH);
  }
  if ("showOnHome" in o) {
    if (typeof o.showOnHome !== "boolean") return { ok: false, error: "showOnHome must be a boolean" };
    patch.showOnHome = o.showOnHome;
  }
  if ("showOnDashboard" in o) {
    if (typeof o.showOnDashboard !== "boolean")
      return { ok: false, error: "showOnDashboard must be a boolean" };
    patch.showOnDashboard = o.showOnDashboard;
  }
  if ("variant" in o) {
    if (typeof o.variant !== "string" || !(VARIANTS as readonly string[]).includes(o.variant)) {
      return { ok: false, error: "variant must be info, warning, or critical" };
    }
    patch.variant = o.variant as SiteNoticeVariant;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No valid fields to update" };
  }

  return { ok: true, patch };
}

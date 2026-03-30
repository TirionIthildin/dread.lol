/**
 * Admin-configurable site notice (MongoDB settings keys).
 * Shown only on `/` and `/dashboard/**` when enabled.
 */
import { getSetting, setSetting } from "@/lib/settings";
import {
  normalizeSiteNoticeFromDb,
  type SiteNoticePatchInput,
  type SiteNoticeSettings,
} from "@/lib/site-notice-settings-shared";

const KEY_ENABLED = "site.notice.enabled";
const KEY_MESSAGE = "site.notice.message";
const KEY_SHOW_ON_HOME = "site.notice.showOnHome";
const KEY_SHOW_ON_DASHBOARD = "site.notice.showOnDashboard";
const KEY_VARIANT = "site.notice.variant";

export async function getSiteNoticeSettings(): Promise<SiteNoticeSettings> {
  const enabled = await getSetting<boolean>(KEY_ENABLED);
  const message = await getSetting<string>(KEY_MESSAGE);
  const showOnHome = await getSetting<boolean>(KEY_SHOW_ON_HOME);
  const showOnDashboard = await getSetting<boolean>(KEY_SHOW_ON_DASHBOARD);
  const variant = await getSetting<string>(KEY_VARIANT);

  return normalizeSiteNoticeFromDb({
    enabled,
    message,
    showOnHome,
    showOnDashboard,
    variant,
  });
}

export async function applySiteNoticePatch(
  patch: SiteNoticePatchInput,
  updatedBy?: string
): Promise<void> {
  if (patch.enabled !== undefined) await setSetting(KEY_ENABLED, patch.enabled, updatedBy);
  if (patch.message !== undefined) await setSetting(KEY_MESSAGE, patch.message, updatedBy);
  if (patch.showOnHome !== undefined) await setSetting(KEY_SHOW_ON_HOME, patch.showOnHome, updatedBy);
  if (patch.showOnDashboard !== undefined)
    await setSetting(KEY_SHOW_ON_DASHBOARD, patch.showOnDashboard, updatedBy);
  if (patch.variant !== undefined) await setSetting(KEY_VARIANT, patch.variant, updatedBy);
}

/** Re-exports server actions from feature modules (each module has its own `"use server"`). */

export type { ProfileFormState } from "./actions/profile-form";
export {
  updateLinksAction,
  updateProfileFieldsAction,
  updateProfileAction,
} from "./actions/profile-form";

export {
  addGalleryItemAction,
  updateGalleryItemAction,
  deleteGalleryItemAction,
  setGalleryOrderAction,
} from "./actions/gallery";

export { addShortLinkAction, deleteShortLinkAction } from "./actions/short-links";

export { createProfileAliasAction, deleteProfileAliasAction } from "./actions/profile-aliases";

export {
  requireAdmin,
  setUserBadgesAction,
  setUserRestrictedAction,
  createBadgeAction,
  updateBadgeAction,
  deleteBadgeAction,
  setUserCustomBadgesAction,
  setCustomBadgeVouchersAction,
  wipeUserSubscriptionAction,
} from "./actions/admin";

export {
  saveProfileVersionAction,
  restoreProfileVersionAction,
  deleteProfileVersionAction,
} from "./actions/profile-versions";

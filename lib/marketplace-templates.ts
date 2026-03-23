/**
 * Community-submitted profile templates. Stored in MongoDB profile_templates.
 */
import { ObjectId } from "mongodb";
import { getDb, getDbName, COLLECTIONS } from "@/lib/db";
import type { ProfileRow } from "@/lib/db/schema";
import { validateBackgroundUrl } from "@/lib/validate-url";
import { resolveCardEffects } from "@/lib/profiles";

/** Template data: profile fields to apply. Media URLs may be /api/files/xxx or external. */
export interface TemplateData {
  tagline?: string | null;
  description?: string | null;
  banner?: string | null;
  discord?: string | null;
  roblox?: string | null;
  links?: string | null;
  quote?: string | null;
  tags?: string[] | null;
  bannerSmall?: boolean;
  bannerAnimatedFire?: boolean;
  bannerStyle?: string | null;
  useTerminalLayout?: boolean;
  terminalTitle?: string | null;
  terminalCommands?: string | null;
  easterEgg?: boolean;
  easterEggTaglineWord?: string | null;
  easterEggLinkTrigger?: string | null;
  easterEggLinkUrl?: string | null;
  easterEggLinkPopupUrl?: string | null;
  accentColor?: string | null;
  terminalPrompt?: string | null;
  nameGreeting?: string | null;
  cardStyle?: string | null;
  cardOpacity?: number | null;
  cardBlur?: "none" | "sm" | "md" | "lg" | null;
  cardEffectsEnabled?: boolean | null;
  cardEffectTilt?: boolean | null;
  cardEffectSpotlight?: boolean | null;
  cardEffectGlare?: boolean | null;
  cardEffectMagneticBorder?: boolean | null;
  customTextColor?: string | null;
  customBackgroundColor?: string | null;
  pronouns?: string | null;
  location?: string | null;
  timezone?: string | null;
  timezoneRange?: string | null;
  birthday?: string | null;
  websiteUrl?: string | null;
  skills?: string[] | null;
  languages?: string | null;
  availability?: string | null;
  currentFocus?: string | null;
  avatarShape?: string | null;
  layoutDensity?: string | null;
  customFont?: string | null;
  customFontUrl?: string | null;
  cursorStyle?: string | null;
  cursorImageUrl?: string | null;
  animationPreset?: string | null;
  nameAnimation?: string | null;
  taglineAnimation?: string | null;
  descriptionAnimation?: string | null;
  backgroundType?: string | null;
  backgroundUrl?: string | null;
  backgroundAudioUrl?: string | null;
  backgroundAudioStartSeconds?: number | null;
  backgroundEffect?: string | null;
  widgetsMatchAccent?: boolean | null;
  unlockOverlayText?: string | null;
  ogImageUrl?: string | null;
  /** Gallery items: imageUrl, title?, description? */
  gallery?: { imageUrl: string; title?: string; description?: string }[] | null;
  /** Audio tracks: url, title? */
  audioTracks?: { url: string; title?: string }[] | null;
  showAudioPlayer?: boolean;
  /** Page theme: classic-dark, classic-light, etc. */
  pageTheme?: "classic-dark" | "classic-light" | "minimalist-light" | "minimalist-dark" | "professional-light" | "professional-dark" | null;
  /** Ordered section IDs for layout. */
  sectionOrder?: string[] | null;
  /** Per-section visibility (true = hidden). */
  sectionVisibility?: Record<string, boolean> | null;
  /** Section IDs removed from profile. */
  removedSectionIds?: string[] | null;
  /** Audio visualizer style: none, bars, waveform, etc. */
  audioVisualizerStyle?: string | null;
  /** Audio visualizer animation. */
  audioVisualizerAnimation?: string | null;
}

/** Whitelist of allowed keys in template data. Used for sanitization on create/update. */
export const TEMPLATE_DATA_KEYS = [
  "tagline", "description", "banner", "discord", "roblox", "links", "quote", "tags",
  "bannerSmall", "bannerAnimatedFire", "bannerStyle", "useTerminalLayout", "terminalTitle",
  "terminalCommands", "easterEgg", "easterEggTaglineWord", "easterEggLinkTrigger",
  "easterEggLinkUrl", "easterEggLinkPopupUrl", "accentColor", "terminalPrompt", "nameGreeting",
  "cardStyle", "cardOpacity", "cardBlur", "cardEffectsEnabled", "cardEffectTilt", "cardEffectSpotlight", "cardEffectGlare", "cardEffectMagneticBorder", "customTextColor", "customBackgroundColor",
  "pronouns", "location", "timezone", "timezoneRange", "birthday", "websiteUrl", "skills", "languages",
  "availability", "currentFocus", "avatarShape", "layoutDensity", "customFont", "customFontUrl",
  "cursorStyle", "cursorImageUrl", "animationPreset", "nameAnimation", "taglineAnimation", "descriptionAnimation",
  "backgroundType", "backgroundUrl", "backgroundAudioUrl", "backgroundAudioStartSeconds",
  "backgroundEffect", "widgetsMatchAccent", "unlockOverlayText", "ogImageUrl", "gallery", "audioTracks",
  "showAudioPlayer", "pageTheme", "sectionOrder", "sectionVisibility", "removedSectionIds",
  "audioVisualizerStyle", "audioVisualizerAnimation",
] as const;

/** Sanitize raw template data: whitelist keys and validate structure. Prevents storing arbitrary junk. */
export function sanitizeTemplateData(data: unknown): TemplateData {
  if (!data || typeof data !== "object") return {};
  const input = data as Record<string, unknown>;
  const allowed = new Set(TEMPLATE_DATA_KEYS);
  const out: TemplateData = {};
  for (const k of allowed) {
    if (!(k in input)) continue;
    const v = input[k];
    if (v === undefined) continue;
    if (k === "gallery") {
      out.gallery = sanitizeGallery(v);
    } else if (k === "audioTracks") {
      out.audioTracks = sanitizeAudioTracks(v);
    } else if (k === "sectionOrder" || k === "removedSectionIds" || k === "tags" || k === "skills") {
      const arr = sanitizeStringArray(v, 200);
      (out as Record<string, unknown>)[k] = arr.length ? arr : null;
    } else if (k === "sectionVisibility") {
      out.sectionVisibility = isRecordOfBooleans(v) ? v : null;
    } else if (k === "pageTheme") {
      out.pageTheme = validatePageTheme(typeof v === "string" ? v : null) ?? undefined;
    } else {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

function sanitizeGallery(v: unknown): TemplateData["gallery"] {
  if (!Array.isArray(v)) return null;
  const out: { imageUrl: string; title?: string; description?: string }[] = [];
  for (const item of v.slice(0, 50)) {
    if (item && typeof item === "object" && typeof (item as { imageUrl?: unknown }).imageUrl === "string") {
      const url = (item as { imageUrl: string }).imageUrl.trim();
      if (url) out.push({ imageUrl: url, title: str((item as { title?: unknown }).title), description: str((item as { description?: unknown }).description) });
    }
  }
  return out.length ? out : null;
}

function sanitizeAudioTracks(v: unknown): TemplateData["audioTracks"] {
  if (!Array.isArray(v)) return null;
  const out: { url: string; title?: string }[] = [];
  for (const item of v.slice(0, 20)) {
    if (item && typeof item === "object" && typeof (item as { url?: unknown }).url === "string") {
      const url = (item as { url: string }).url.trim();
      if (url) out.push({ url, title: str((item as { title?: unknown }).title) });
    }
  }
  return out.length ? out : null;
}

const PAGE_THEMES = ["classic-dark", "classic-light", "minimalist-light", "minimalist-dark", "professional-light", "professional-dark"] as const;

function validatePageTheme(
  v: string | null | undefined
): (typeof PAGE_THEMES)[number] | null {
  if (!v || typeof v !== "string") return null;
  return PAGE_THEMES.includes(v as (typeof PAGE_THEMES)[number]) ? (v as (typeof PAGE_THEMES)[number]) : null;
}

function sanitizeStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[]).filter((x): x is string => typeof x === "string").slice(0, max);
}

function str(x: unknown): string | undefined {
  return typeof x === "string" ? x.trim() || undefined : undefined;
}

function isRecordOfBooleans(v: unknown): v is Record<string, boolean> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  for (const val of Object.values(v as Record<string, unknown>)) {
    if (typeof val !== "boolean") return false;
  }
  return true;
}

export interface TemplateDoc {
  _id: ObjectId;
  creatorId: string;
  name: string;
  description?: string | null;
  previewUrl?: string | null;
  data: TemplateData;
  applyCount: number;
  status: "draft" | "published" | "unpublished";
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateRow = Omit<TemplateDoc, "_id"> & { id: string };

function toTemplateRow(doc: TemplateDoc): TemplateRow {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() };
}

/** Extract profile fields for template from ProfileRow. Omits slug, name, avatar (user identity). */
export function profileToTemplateData(profile: ProfileRow): TemplateData {
  const links = profile.links ?? null;
  const terminalCommands = profile.terminalCommands ?? null;
  const tags = profile.tags ?? null;
  return {
    tagline: profile.tagline ?? null,
    description: profile.description ?? null,
    banner: profile.banner ?? null,
    discord: profile.discord ?? null,
    roblox: profile.roblox ?? null,
    links,
    quote: profile.quote ?? null,
    tags,
    bannerSmall: profile.bannerSmall ?? false,
    bannerAnimatedFire: profile.bannerAnimatedFire ?? false,
    bannerStyle: profile.bannerStyle ?? null,
    useTerminalLayout: profile.useTerminalLayout ?? false,
    terminalTitle: profile.terminalTitle ?? null,
    terminalCommands,
    easterEgg: profile.easterEgg ?? false,
    easterEggTaglineWord: profile.easterEggTaglineWord ?? null,
    easterEggLinkTrigger: profile.easterEggLinkTrigger ?? null,
    easterEggLinkUrl: profile.easterEggLinkUrl ?? null,
    easterEggLinkPopupUrl: profile.easterEggLinkPopupUrl ?? null,
    accentColor: profile.accentColor ?? null,
    terminalPrompt: profile.terminalPrompt ?? null,
    nameGreeting: profile.nameGreeting ?? null,
    cardStyle: profile.cardStyle ?? null,
    cardOpacity: profile.cardOpacity ?? null,
    cardEffectsEnabled: (profile as { cardEffectsEnabled?: boolean }).cardEffectsEnabled ?? null,
    cardEffectTilt: (profile as { cardEffectTilt?: boolean }).cardEffectTilt ?? null,
    cardEffectSpotlight: (profile as { cardEffectSpotlight?: boolean }).cardEffectSpotlight ?? null,
    cardEffectGlare: (profile as { cardEffectGlare?: boolean }).cardEffectGlare ?? null,
    cardEffectMagneticBorder: (profile as { cardEffectMagneticBorder?: boolean }).cardEffectMagneticBorder ?? null,
    cardBlur: (() => {
      const b = (profile as { cardBlur?: string | null }).cardBlur;
      if (b && ["none", "sm", "md", "lg"].includes(b)) return b as "none" | "sm" | "md" | "lg";
      return null;
    })(),
    customTextColor: (profile as { customTextColor?: string | null }).customTextColor ?? null,
    customBackgroundColor: (profile as { customBackgroundColor?: string | null }).customBackgroundColor ?? null,
    pronouns: profile.pronouns ?? null,
    location: profile.location ?? null,
    timezone: profile.timezone ?? null,
    timezoneRange: profile.timezoneRange ?? null,
    birthday: profile.birthday ?? null,
    websiteUrl: profile.websiteUrl ?? null,
    skills: profile.skills ?? null,
    languages: profile.languages ?? null,
    availability: profile.availability ?? null,
    currentFocus: profile.currentFocus ?? null,
    avatarShape: profile.avatarShape ?? null,
    layoutDensity: profile.layoutDensity ?? null,
    customFont: profile.customFont ?? null,
    customFontUrl: profile.customFontUrl ?? null,
    cursorStyle: profile.cursorStyle ?? null,
    cursorImageUrl: profile.cursorImageUrl ?? null,
    animationPreset: profile.animationPreset ?? null,
    nameAnimation: (profile as { nameAnimation?: string | null }).nameAnimation ?? null,
    taglineAnimation: (profile as { taglineAnimation?: string | null }).taglineAnimation ?? null,
    descriptionAnimation: (profile as { descriptionAnimation?: string | null }).descriptionAnimation ?? null,
    backgroundType: profile.backgroundType ?? null,
    backgroundUrl: profile.backgroundUrl ?? null,
    backgroundAudioUrl: profile.backgroundAudioUrl ?? null,
    backgroundAudioStartSeconds: (profile as { backgroundAudioStartSeconds?: number | null }).backgroundAudioStartSeconds ?? null,
    backgroundEffect: (profile as { backgroundEffect?: string | null }).backgroundEffect ?? null,
    widgetsMatchAccent: (profile as { widgetsMatchAccent?: boolean | null }).widgetsMatchAccent ?? null,
    unlockOverlayText: (profile as { unlockOverlayText?: string | null }).unlockOverlayText ?? null,
    ogImageUrl: profile.ogImageUrl ?? null,
    showAudioPlayer: profile.showAudioPlayer ?? false,
    gallery: null, // Populate from gallery_items when creating from profile
    audioTracks: profile.audioTracks ? parseAudioTracks(profile.audioTracks) : null,
    pageTheme: validatePageTheme((profile as { pageTheme?: string | null }).pageTheme) ?? null,
    sectionOrder: (profile as { sectionOrder?: string[] | null }).sectionOrder ?? null,
    sectionVisibility: (profile as { sectionVisibility?: Record<string, boolean> | null }).sectionVisibility ?? null,
    removedSectionIds: (profile as { removedSectionIds?: string[] | null }).removedSectionIds ?? null,
    audioVisualizerStyle: (profile as { audioVisualizerStyle?: string | null }).audioVisualizerStyle ?? null,
    audioVisualizerAnimation: (profile as { audioVisualizerAnimation?: string | null }).audioVisualizerAnimation ?? null,
  };
}

function parseAudioTracks(raw: string | null | undefined): { url: string; title?: string }[] | null {
  if (!raw?.trim()) return null;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return null;
    return arr
      .filter(
        (x): x is { url: string; title?: string } =>
          x && typeof x === "object" && typeof (x as { url?: unknown }).url === "string"
      )
      .map((x) => ({
        url: (x as { url: string }).url.trim(),
        title: (x as { title?: string }).title?.trim(),
      }))
      .filter((x) => x.url.length > 0);
  } catch {
    return null;
  }
}

/** Build template data from profile + optional gallery override. */
export async function buildTemplateDataFromProfile(
  profileId: string,
  profile: ProfileRow,
  galleryOverride?: { imageUrl: string; title?: string; description?: string }[]
): Promise<TemplateData> {
  const base = profileToTemplateData(profile);
  if (galleryOverride) {
    base.gallery = galleryOverride;
    return base;
  }
  const { getGalleryForProfile } = await import("@/lib/member-profiles");
  const gallery = await getGalleryForProfile(profileId);
  if (gallery.length > 0) {
    base.gallery = gallery.map((g) => ({
      imageUrl: g.imageUrl,
      title: g.title ?? undefined,
      description: g.description ?? undefined,
    }));
  }
  return base;
}

/** List published templates with optional sort and search. */
export async function listPublishedTemplates(options?: {
  limit?: number;
  skip?: number;
  sort?: "applied" | "recent";
  q?: string;
}): Promise<{
  items: (TemplateRow & { creatorSlug?: string | null })[];
  featured: (TemplateRow & { creatorSlug?: string | null })[];
  total: number;
}> {
  const limit = Math.min(50, Math.max(1, options?.limit ?? 20));
  const skip = Math.max(0, options?.skip ?? 0);
  const sort = options?.sort === "recent" ? "recent" : "applied";
  const q = typeof options?.q === "string" ? options.q.trim().toLowerCase().slice(0, 200) : undefined;

  const client = await getDb();
  const dbName = await getDbName();
  const db = client.db(dbName);
  const coll = db.collection<TemplateDoc>(COLLECTIONS.profileTemplates);

  const filter: Record<string, unknown> = { status: "published" as const };
  if (q && q.length > 0) {
    filter.$or = [
      { name: { $regex: escapeRegex(q), $options: "i" } },
      { description: { $regex: escapeRegex(q), $options: "i" } },
    ];
  }

  const sortObj =
    sort === "recent"
      ? ({ createdAt: -1, applyCount: -1 } as const)
      : ({ applyCount: -1, createdAt: -1 } as const);

  // Fetch featured separately for the "Featured" section
  const featuredFilter = { ...filter, featured: true };
  const [featuredItems, allItems, total] = await Promise.all([
    coll.find(featuredFilter).sort(sortObj).limit(6).toArray(),
    coll.find(filter).sort(sortObj).skip(skip).limit(limit).toArray(),
    coll.countDocuments(filter),
  ]);

  const items = allItems;
  const rows = items.map(toTemplateRow);
  const featuredRows = featuredItems.map(toTemplateRow);
  const creatorIds = [...new Set([...items, ...featuredItems].map((i) => i.creatorId))];
  const { getProfileSlugsByUserIds } = await import("@/lib/member-profiles");
  const slugMap = await getProfileSlugsByUserIds(creatorIds);

  const rowsWithCreator = rows.map((r) => ({
    ...r,
    creatorSlug: slugMap.get(r.creatorId) ?? null,
  }));
  const featuredWithCreator = featuredRows.map((r) => ({
    ...r,
    creatorSlug: slugMap.get(r.creatorId) ?? null,
  }));

  return { items: rowsWithCreator, featured: featuredWithCreator, total };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Get a single template by ID. Includes creatorSlug if resolvable. */
export async function getTemplateById(id: string): Promise<(TemplateRow & { creatorSlug?: string | null }) | null> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return null;
  }
  const client = await getDb();
  const dbName = await getDbName();
  const doc = await client
    .db(dbName)
    .collection<TemplateDoc>(COLLECTIONS.profileTemplates)
    .findOne({ _id: oid });
  if (!doc) return null;
  const row = toTemplateRow(doc);
  const { getProfileSlugsByUserIds } = await import("@/lib/member-profiles");
  const slugMap = await getProfileSlugsByUserIds([doc.creatorId]);
  return { ...row, creatorSlug: slugMap.get(doc.creatorId) ?? null };
}

/** List all templates for admin (all statuses, all creators). */
export async function listAllTemplatesForAdmin(): Promise<TemplateRow[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client
    .db(dbName)
    .collection<TemplateDoc>(COLLECTIONS.profileTemplates)
    .find()
    .sort({ updatedAt: -1 })
    .toArray();
  return docs.map(toTemplateRow);
}

/** Get templates created by a user (all statuses). */
export async function getTemplatesByCreator(creatorId: string): Promise<TemplateRow[]> {
  const client = await getDb();
  const dbName = await getDbName();
  const docs = await client
    .db(dbName)
    .collection<TemplateDoc>(COLLECTIONS.profileTemplates)
    .find({ creatorId })
    .sort({ updatedAt: -1 })
    .toArray();
  return docs.map(toTemplateRow);
}

/** Create a new template (draft). */
export async function createTemplate(
  creatorId: string,
  data: { name: string; description?: string; previewUrl?: string; data: TemplateData }
): Promise<{ id: string } | { error: string }> {
  const name = data.name?.trim().slice(0, 100);
  if (!name) return { error: "Name is required" };

  const client = await getDb();
  const dbName = await getDbName();
  const now = new Date();
  const doc: Omit<TemplateDoc, "_id"> & { _id: ObjectId } = {
    _id: new ObjectId(),
    creatorId,
    name,
    description: data.description?.trim().slice(0, 500) ?? null,
    previewUrl: validateBackgroundUrl(data.previewUrl?.trim()) ?? null,
    data: sanitizeTemplateData(data.data ?? {}),
    applyCount: 0,
    status: "draft",
    featured: false,
    createdAt: now,
    updatedAt: now,
  };
  await client.db(dbName).collection(COLLECTIONS.profileTemplates).insertOne(doc);
  return { id: doc._id.toString() };
}

/** Update a template. Creator only. */
export async function updateTemplate(
  id: string,
  creatorId: string,
  updates: { name?: string; description?: string; previewUrl?: string; data?: TemplateData }
): Promise<boolean> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return false;
  }
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name !== undefined) set.name = updates.name.trim().slice(0, 100);
  if (updates.description !== undefined) set.description = updates.description?.trim().slice(0, 500) ?? null;
  if (updates.previewUrl !== undefined) set.previewUrl = validateBackgroundUrl(updates.previewUrl?.trim()) ?? null;
  if (updates.data !== undefined) set.data = sanitizeTemplateData(updates.data);

  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.profileTemplates)
    .updateOne({ _id: oid, creatorId }, { $set: set });
  return result.matchedCount > 0;
}

/** Set template status to published. Creator only. */
export async function publishTemplate(id: string, creatorId: string): Promise<boolean> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return false;
  }
  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.profileTemplates)
    .updateOne({ _id: oid, creatorId }, { $set: { status: "published", updatedAt: new Date() } });
  return result.matchedCount > 0;
}

/** Set template status to unpublished. Creator only. */
export async function unpublishTemplate(id: string, creatorId: string): Promise<boolean> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return false;
  }
  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.profileTemplates)
    .updateOne({ _id: oid, creatorId }, { $set: { status: "unpublished", updatedAt: new Date() } });
  return result.matchedCount > 0;
}

/** Set template featured flag. Admin only. */
export async function setTemplateFeatured(id: string, featured: boolean): Promise<boolean> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return false;
  }
  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.profileTemplates)
    .updateOne({ _id: oid }, { $set: { featured, updatedAt: new Date() } });
  return result.matchedCount > 0;
}

/** Unpublish template. Admin only (can unpublish any template). */
export async function adminUnpublishTemplate(id: string): Promise<boolean> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return false;
  }
  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.profileTemplates)
    .updateOne({ _id: oid }, { $set: { status: "unpublished", updatedAt: new Date() } });
  return result.matchedCount > 0;
}

/** Delete a template. Creator only. */
export async function deleteTemplate(id: string, creatorId: string): Promise<boolean> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return false;
  }
  const client = await getDb();
  const dbName = await getDbName();
  const result = await client
    .db(dbName)
    .collection(COLLECTIONS.profileTemplates)
    .deleteOne({ _id: oid, creatorId });
  return result.deletedCount > 0;
}

/** Increment applyCount and return updated template. */
export async function incrementTemplateApplyCount(id: string): Promise<void> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return;
  }
  const client = await getDb();
  const dbName = await getDbName();
  await client
    .db(dbName)
    .collection(COLLECTIONS.profileTemplates)
    .updateOne({ _id: oid }, { $inc: { applyCount: 1 } });
}

/** Copy-on-apply: replace /api/files/ URLs with new copies. External URLs pass through.
 * When copy fails for internal URLs, omits them (do not leak creator's files). */
async function copyTemplateMediaUrls(data: TemplateData): Promise<TemplateData> {
  const { copyFile } = await import("@/lib/seaweed");

  const copyIfInternal = async (url: string | null | undefined): Promise<string | null | undefined> => {
    if (!url?.trim()) return url;
    if (url.startsWith("/api/files/")) {
      const newPath = await copyFile(url);
      return newPath ?? null;
    }
    return url;
  };

  const out: TemplateData = { ...data };

  const bgUrl = await copyIfInternal(data.backgroundUrl);
  out.backgroundUrl = bgUrl ?? undefined;
  const bgAudioUrl = await copyIfInternal(data.backgroundAudioUrl);
  out.backgroundAudioUrl = bgAudioUrl ?? undefined;
  const ogUrl = await copyIfInternal(data.ogImageUrl);
  out.ogImageUrl = ogUrl ?? undefined;
  const cursorUrl = await copyIfInternal(data.cursorImageUrl);
  out.cursorImageUrl = cursorUrl ?? undefined;
  const fontUrl = await copyIfInternal(data.customFontUrl);
  out.customFontUrl = fontUrl ?? undefined;

  if (data.gallery?.length) {
    const galleryItems = await Promise.all(
      data.gallery.map(async (g) => {
        const newUrl = await copyIfInternal(g.imageUrl);
        const isInternal = g.imageUrl?.startsWith("/api/files/");
        if (isInternal && !newUrl) return null;
        return { ...g, imageUrl: newUrl ?? g.imageUrl } as const;
      })
    );
    out.gallery = galleryItems.filter((x): x is NonNullable<typeof x> => x !== null && !!x.imageUrl);
  }

  if (data.audioTracks?.length) {
    const trackItems = await Promise.all(
      data.audioTracks.map(async (t) => {
        const newUrl = await copyIfInternal(t.url);
        const isInternal = t.url?.startsWith("/api/files/");
        if (isInternal && !newUrl) return null;
        return { ...t, url: newUrl ?? t.url } as const;
      })
    );
    out.audioTracks = trackItems.filter((x): x is NonNullable<typeof x> => x !== null && !!x.url);
  }

  return out;
}

/** Convert TemplateData to profile update record for updateMemberProfile. */
function templateDataToProfileUpdate(data: TemplateData): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  if (data.tagline !== undefined) update.tagline = data.tagline;
  if (data.description !== undefined) update.description = data.description;
  if (data.banner !== undefined) update.banner = data.banner;
  if (data.discord !== undefined) update.discord = data.discord;
  if (data.roblox !== undefined) update.roblox = data.roblox;
  if (data.links !== undefined) update.links = typeof data.links === "string" ? data.links : (data.links ? JSON.stringify(data.links) : null);
  if (data.quote !== undefined) update.quote = data.quote;
  if (data.tags !== undefined) update.tags = data.tags;
  if (data.bannerSmall !== undefined) update.bannerSmall = data.bannerSmall;
  if (data.bannerAnimatedFire !== undefined) update.bannerAnimatedFire = data.bannerAnimatedFire;
  if (data.bannerStyle !== undefined) update.bannerStyle = data.bannerStyle;
  if (data.useTerminalLayout !== undefined) update.useTerminalLayout = data.useTerminalLayout;
  if (data.terminalTitle !== undefined) update.terminalTitle = data.terminalTitle;
  if (data.terminalCommands !== undefined) update.terminalCommands = data.terminalCommands;
  if (data.easterEgg !== undefined) update.easterEgg = data.easterEgg;
  if (data.easterEggTaglineWord !== undefined) update.easterEggTaglineWord = data.easterEggTaglineWord;
  if (data.easterEggLinkTrigger !== undefined) update.easterEggLinkTrigger = data.easterEggLinkTrigger;
  if (data.easterEggLinkUrl !== undefined) update.easterEggLinkUrl = data.easterEggLinkUrl;
  if (data.easterEggLinkPopupUrl !== undefined) update.easterEggLinkPopupUrl = data.easterEggLinkPopupUrl;
  if (data.accentColor !== undefined) update.accentColor = data.accentColor;
  if (data.terminalPrompt !== undefined) update.terminalPrompt = data.terminalPrompt;
  if (data.nameGreeting !== undefined) update.nameGreeting = data.nameGreeting;
  if (data.cardStyle !== undefined) update.cardStyle = data.cardStyle;
  if (data.cardOpacity !== undefined) update.cardOpacity = data.cardOpacity;
  if (data.cardBlur !== undefined) update.cardBlur = data.cardBlur;
  if (data.cardEffectsEnabled !== undefined) update.cardEffectsEnabled = data.cardEffectsEnabled;
  if (data.cardEffectTilt !== undefined) update.cardEffectTilt = data.cardEffectTilt;
  if (data.cardEffectSpotlight !== undefined) update.cardEffectSpotlight = data.cardEffectSpotlight;
  if (data.cardEffectGlare !== undefined) update.cardEffectGlare = data.cardEffectGlare;
  if (data.cardEffectMagneticBorder !== undefined) update.cardEffectMagneticBorder = data.cardEffectMagneticBorder;
  if (data.customTextColor !== undefined) update.customTextColor = data.customTextColor;
  if (data.customBackgroundColor !== undefined) update.customBackgroundColor = data.customBackgroundColor;
  if (data.pronouns !== undefined) update.pronouns = data.pronouns;
  if (data.location !== undefined) update.location = data.location;
  if (data.timezone !== undefined) update.timezone = data.timezone;
  if (data.timezoneRange !== undefined) update.timezoneRange = data.timezoneRange;
  if (data.birthday !== undefined) update.birthday = data.birthday;
  if (data.websiteUrl !== undefined) update.websiteUrl = data.websiteUrl;
  if (data.skills !== undefined) update.skills = data.skills;
  if (data.languages !== undefined) update.languages = data.languages;
  if (data.availability !== undefined) update.availability = data.availability;
  if (data.currentFocus !== undefined) update.currentFocus = data.currentFocus;
  if (data.avatarShape !== undefined) update.avatarShape = data.avatarShape;
  if (data.layoutDensity !== undefined) update.layoutDensity = data.layoutDensity;
  if (data.customFont !== undefined) update.customFont = data.customFont;
  if (data.customFontUrl !== undefined) update.customFontUrl = data.customFontUrl;
  if (data.cursorStyle !== undefined) update.cursorStyle = data.cursorStyle;
  if (data.cursorImageUrl !== undefined) update.cursorImageUrl = data.cursorImageUrl;
  if (data.animationPreset !== undefined) update.animationPreset = data.animationPreset;
  if (data.nameAnimation !== undefined) update.nameAnimation = data.nameAnimation;
  if (data.taglineAnimation !== undefined) update.taglineAnimation = data.taglineAnimation;
  if (data.descriptionAnimation !== undefined) update.descriptionAnimation = data.descriptionAnimation;
  if (data.backgroundType !== undefined) update.backgroundType = data.backgroundType;
  if (data.backgroundUrl !== undefined) update.backgroundUrl = data.backgroundUrl;
  if (data.backgroundAudioUrl !== undefined) update.backgroundAudioUrl = data.backgroundAudioUrl;
  if (data.backgroundAudioStartSeconds !== undefined) update.backgroundAudioStartSeconds = data.backgroundAudioStartSeconds;
  if (data.backgroundEffect !== undefined) update.backgroundEffect = data.backgroundEffect;
  if (data.widgetsMatchAccent !== undefined) update.widgetsMatchAccent = data.widgetsMatchAccent;
  if (data.unlockOverlayText !== undefined) update.unlockOverlayText = data.unlockOverlayText;
  if (data.ogImageUrl !== undefined) update.ogImageUrl = data.ogImageUrl;
  if (data.showAudioPlayer !== undefined) update.showAudioPlayer = data.showAudioPlayer;
  if (data.audioTracks !== undefined) {
    update.audioTracks = data.audioTracks && data.audioTracks.length > 0 ? JSON.stringify(data.audioTracks) : null;
  }
  if (data.pageTheme !== undefined) update.pageTheme = data.pageTheme;
  if (data.sectionOrder !== undefined) update.sectionOrder = data.sectionOrder;
  if (data.sectionVisibility !== undefined) update.sectionVisibility = data.sectionVisibility;
  if (data.removedSectionIds !== undefined) update.removedSectionIds = data.removedSectionIds;
  if (data.audioVisualizerStyle !== undefined) update.audioVisualizerStyle = data.audioVisualizerStyle;
  if (data.audioVisualizerAnimation !== undefined) update.audioVisualizerAnimation = data.audioVisualizerAnimation;
  return update;
}

function parseTerminalCommandsForProfile(raw: string | null | undefined): { command: string; output: string }[] | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return undefined;
    return arr.filter(
      (x): x is { command: string; output: string } =>
        x && typeof x === "object" && typeof (x as { command?: string }).command === "string" && typeof (x as { output?: string }).output === "string"
    );
  } catch {
    return undefined;
  }
}

/** Build a Profile from template data for preview rendering. */
export function templateToProfile(template: TemplateRow): import("@/lib/profiles").Profile {
  const d = template.data;
  const links = d.links
    ? typeof d.links === "string"
      ? (() => {
          try {
            const arr = JSON.parse(d.links) as unknown;
            return Array.isArray(arr)
              ? arr.filter(
                  (x): x is { label: string; href: string } =>
                    x && typeof x === "object" && typeof (x as { label?: string }).label === "string" && typeof (x as { href?: string }).href === "string"
                )
              : undefined;
          } catch {
            return undefined;
          }
        })()
      : d.links
    : undefined;
  const easterEggLink =
    d.easterEggLinkTrigger && d.easterEggLinkUrl
      ? {
          triggerWord: d.easterEggLinkTrigger,
          url: d.easterEggLinkUrl,
          popupUrl: d.easterEggLinkPopupUrl ?? undefined,
        }
      : undefined;
  const gallery = d.gallery?.map((g, i) => ({
    id: `preview-${i}`,
    imageUrl: g.imageUrl,
    title: g.title,
    description: g.description,
    sortOrder: i,
  }));
  return {
    slug: "preview",
    name: template.name,
    tagline: d.tagline ?? undefined,
    description: d.description ?? "",
    banner: d.banner ?? undefined,
    discord: d.discord ?? undefined,
    roblox: d.roblox ?? undefined,
    links,
    quote: d.quote ?? undefined,
    tags: d.tags ?? undefined,
    bannerSmall: d.bannerSmall ?? false,
    bannerAnimatedFire: d.bannerAnimatedFire ?? false,
    bannerStyle: d.bannerStyle ?? undefined,
    useTerminalLayout: d.useTerminalLayout ?? false,
    terminalTitle: d.terminalTitle ?? undefined,
    terminalCommands: parseTerminalCommandsForProfile(
      typeof d.terminalCommands === "string" ? d.terminalCommands : undefined
    ),
    easterEgg: d.easterEgg ?? false,
    easterEggTaglineWord: d.easterEggTaglineWord ?? undefined,
    easterEggLink,
    accentColor: d.accentColor ?? undefined,
    terminalPrompt: d.terminalPrompt ?? undefined,
    nameGreeting: d.nameGreeting ?? undefined,
    cardStyle: d.cardStyle ?? undefined,
    cardOpacity: d.cardOpacity ?? undefined,
    cardBlur: d.cardBlur && ["none", "sm", "md", "lg"].includes(d.cardBlur) ? d.cardBlur : undefined,
    ...resolveCardEffects({
      cardEffectsEnabled: d.cardEffectsEnabled ?? null,
      cardEffectTilt: d.cardEffectTilt ?? null,
      cardEffectSpotlight: d.cardEffectSpotlight ?? null,
      cardEffectGlare: d.cardEffectGlare ?? null,
      cardEffectMagneticBorder: d.cardEffectMagneticBorder ?? null,
    }),
    customTextColor: d.customTextColor && /^#[0-9a-fA-F]{6}$/.test(d.customTextColor) ? d.customTextColor : undefined,
    customBackgroundColor: d.customBackgroundColor && /^#[0-9a-fA-F]{6}$/.test(d.customBackgroundColor) ? d.customBackgroundColor : undefined,
    pronouns: d.pronouns ?? undefined,
    location: d.location ?? undefined,
    timezone: d.timezone ?? undefined,
    timezoneRange: d.timezoneRange ?? undefined,
    birthday: d.birthday ?? undefined,
    websiteUrl: d.websiteUrl ?? undefined,
    skills: d.skills ?? undefined,
    languages: d.languages ?? undefined,
    availability: d.availability ?? undefined,
    currentFocus: d.currentFocus ?? undefined,
    avatarShape: d.avatarShape ?? undefined,
    layoutDensity: d.layoutDensity ?? undefined,
    customFont: d.customFont ?? undefined,
    customFontUrl: d.customFontUrl ?? undefined,
    cursorStyle: d.cursorStyle ?? undefined,
    cursorImageUrl: d.cursorImageUrl ?? undefined,
    animationPreset: d.animationPreset ?? undefined,
    nameAnimation: d.nameAnimation ?? undefined,
    taglineAnimation: d.taglineAnimation ?? undefined,
    descriptionAnimation: d.descriptionAnimation ?? undefined,
    backgroundType: d.backgroundType ?? undefined,
    backgroundUrl: d.backgroundUrl ?? undefined,
    backgroundAudioUrl: d.backgroundAudioUrl ?? undefined,
    backgroundAudioStartSeconds: (d as { backgroundAudioStartSeconds?: number | null }).backgroundAudioStartSeconds ?? undefined,
    backgroundEffect: (d as { backgroundEffect?: string | null }).backgroundEffect ?? undefined,
    widgetsMatchAccent: (d as { widgetsMatchAccent?: boolean | null }).widgetsMatchAccent ?? undefined,
    unlockOverlayText: d.unlockOverlayText ?? undefined,
    ogImageUrl: d.ogImageUrl ?? undefined,
    showAudioPlayer: d.showAudioPlayer ?? false,
    audioTracks: d.audioTracks ?? undefined,
    gallery,
    pageTheme: d.pageTheme ?? undefined,
    sectionOrder: d.sectionOrder ?? undefined,
    sectionVisibility: d.sectionVisibility ?? undefined,
    removedSectionIds: d.removedSectionIds ?? undefined,
    audioVisualizerStyle: d.audioVisualizerStyle ?? undefined,
    audioVisualizerAnimation: d.audioVisualizerAnimation ?? undefined,
    noindex: true,
  };
}

/** Apply a published template to the user's profile. Copies media on apply. */
export async function applyTemplate(
  templateId: string,
  profileId: string,
  userId: string
): Promise<{ error?: string }> {
  const template = await getTemplateById(templateId);
  if (!template) return { error: "Template not found" };
  if (template.status !== "published") return { error: "Template is not published" };

  const dataWithCopiedMedia = await copyTemplateMediaUrls(template.data);
  const update = templateDataToProfileUpdate(dataWithCopiedMedia);

  const { updateMemberProfile, replaceGalleryItems } = await import("@/lib/member-profiles");
  try {
    await updateMemberProfile(profileId, userId, update);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to apply template" };
  }

  if (dataWithCopiedMedia.gallery?.length) {
    try {
      await replaceGalleryItems(profileId, userId, dataWithCopiedMedia.gallery);
    } catch (e) {
      console.error("Template apply: replace gallery failed", e);
      // Profile update succeeded; gallery may be partial
    }
  }

  await incrementTemplateApplyCount(templateId);
  return {};
}

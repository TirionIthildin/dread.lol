export const TAGLINE_MAX = 120;
export const DESCRIPTION_MAX = 2000;

export const PREVIEW_STORAGE_KEY = "dread-preview-profile";
export const PREVIEW_MESSAGE_TYPE = "dread-preview-update";

/** .png, .jpg, .jpeg, .gif, .webp */
export const BACKGROUND_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/x-gif", "image/webp"];
/** .mp4, .m4v, .webm, .mov, .mkv */
export const BACKGROUND_VIDEO_TYPES = ["video/mp4", "video/x-m4v", "video/webm", "video/quicktime", "video/x-matroska"];

export const MAX_WIDGETS = 4;

/** Background type toggles in profile editor (Styling). */
export const PROFILE_BG_TYPE_OPTIONS = ["grid", "gradient", "solid", "dither", "image", "video"] as const;

/** Background overlay effects (Premium). */
export const PROFILE_BG_EFFECT_OPTIONS = ["none", "snow", "rain", "blur", "retro-computer"] as const;

/** Grouped IANA timezones for local time display. */
export const TIMEZONE_GROUPS: { label: string; zones: string[] }[] = [
  {
    label: "Americas",
    zones: [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "America/Phoenix",
      "America/Toronto",
      "America/Vancouver",
      "America/Montreal",
      "America/Mexico_City",
      "America/Sao_Paulo",
      "America/Buenos_Aires",
    ],
  },
  {
    label: "Europe",
    zones: [
      "Europe/London",
      "Europe/Berlin",
      "Europe/Paris",
      "Europe/Amsterdam",
      "Europe/Dublin",
      "Europe/Madrid",
      "Europe/Rome",
      "Europe/Stockholm",
      "Europe/Copenhagen",
      "Europe/Warsaw",
      "Europe/Prague",
      "Europe/Vienna",
      "Europe/Zurich",
      "Europe/Athens",
      "Europe/Helsinki",
      "Europe/Istanbul",
    ],
  },
  {
    label: "Asia / Pacific",
    zones: [
      "Asia/Tokyo",
      "Asia/Seoul",
      "Asia/Shanghai",
      "Asia/Hong_Kong",
      "Asia/Singapore",
      "Asia/Bangkok",
      "Asia/Kolkata",
      "Asia/Dubai",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Pacific/Auckland",
    ],
  },
];

export const TIMEZONE_SELECT_GROUPS = TIMEZONE_GROUPS.map((g) => ({
  label: g.label,
  options: g.zones.map((tz) => ({ value: tz, label: tz.replace(/_/g, " ") })),
}));

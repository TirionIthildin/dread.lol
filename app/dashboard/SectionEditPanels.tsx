"use client";

import Link from "next/link";
import { useCallback, useState, useRef } from "react";
import { FloppyDisk, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { updateProfileFieldsAction } from "@/app/dashboard/actions";
import type { Profile } from "@/lib/profiles";
import type { ProfileSectionId } from "@/lib/profile-sections";
import { SECTION_DEFINITIONS } from "@/lib/profile-sections";
import { ACCENT_THEMES } from "@/lib/profile-themes";
import DashboardLinks from "@/app/dashboard/DashboardLinks";
import type { ProfileRow } from "@/lib/db/schema";
import { useFormStatus } from "react-dom";

const inputClass = "mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";
const labelClass = "block text-xs font-medium text-[var(--muted)]";

export type SectionEditPanelSectionId = ProfileSectionId | "style";

interface SectionEditPanelProps {
  sectionId: SectionEditPanelSectionId;
  profile: Profile;
  profileId: string;
  profileRow: ProfileRow;
  onProfileChange: (profile: Profile) => void;
  hasPremium?: boolean;
}

function SaveButton({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent)]/20 px-4 py-2 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/30 disabled:opacity-50"
    >
      <FloppyDisk size={16} weight="regular" />
      {pending ? "Saving…" : label}
    </button>
  );
}

export function SectionEditPanel({
  sectionId,
  profile,
  profileId,
  profileRow,
  onProfileChange,
  hasPremium = false,
}: SectionEditPanelProps) {
  const def = sectionId === "style" ? { label: "Style & appearance" } : SECTION_DEFINITIONS.find((d) => d.id === sectionId);
  if (!def && sectionId !== "style") return null;

  const handleSave = useCallback(
    async (fields: Record<string, unknown>) => {
      const result = await updateProfileFieldsAction(profileId, fields);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Saved");
        const merged = { ...profile, ...fields } as Profile;
        if ("avatarUrl" in fields && fields.avatarUrl != null) (merged as Profile & { avatar?: string }).avatar = fields.avatarUrl as string;
        onProfileChange(merged);
      }
    },
    [profileId, profile, onProfileChange]
  );

  if (sectionId === "style") {
    return <StylePanel profile={profile} onSave={handleSave} onProfileChange={onProfileChange} hasPremium={hasPremium} />;
  }

  switch (sectionId) {
    case "banner":
      return <BannerPanel profile={profile} onSave={handleSave} onProfileChange={onProfileChange} />;
    case "hero":
      return <HeroPanel profile={profile} onSave={handleSave} onProfileChange={onProfileChange} hasPremium={hasPremium} />;
    case "description":
      return <DescriptionPanel profile={profile} onSave={handleSave} onProfileChange={onProfileChange} hasPremium={hasPremium} />;
    case "tags":
      return <TagsPanel profile={profile} onSave={handleSave} />;
    case "skills":
      return <SkillsPanel profile={profile} onSave={handleSave} />;
    case "quote":
      return <QuotePanel profile={profile} onSave={handleSave} onProfileChange={onProfileChange} />;
    case "links":
      return <LinksPanel profileRow={profileRow} profileId={profileId} onProfileChange={onProfileChange} />;
    case "discord-widgets":
      return <DiscordWidgetsPanel profile={profile} profileRow={profileRow} onSave={handleSave} onProfileChange={onProfileChange} />;
    case "roblox-widgets":
      return <RobloxWidgetsPanel profile={profile} profileRow={profileRow} onSave={handleSave} onProfileChange={onProfileChange} />;
    case "gallery-blog":
      return <GalleryBlogPanel def={def ?? { label: "Gallery & blog" }} />;
    case "audio":
      return <AudioPanel profile={profile} onSave={handleSave} onProfileChange={onProfileChange} />;
    case "similar":
      return <InfoPanel title={def?.label ?? "Similar"} text="Similar profiles are suggested automatically based on your profile." />;
    case "vouches":
      return <InfoPanel title={def?.label ?? "Vouches"} text="Vouches and view count appear here. Edit in Basics to toggle view count." />;
    default:
      return <InfoPanel title={def?.label ?? String(sectionId)} text="Click a section to edit its content." />;
  }
}

function InfoPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)]/60 bg-[var(--surface)]/40 px-4 py-3 text-sm text-[var(--muted)]">
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      <p className="mt-1">{text}</p>
    </div>
  );
}

function BannerPanel({
  profile,
  onSave,
  onProfileChange,
}: {
  profile: Profile;
  onSave: (f: Record<string, unknown>) => Promise<void>;
  onProfileChange: (p: Profile) => void;
}) {
  const [banner, setBanner] = useState(profile.banner ?? "");
  const [bannerStyle, setBannerStyle] = useState(profile.bannerStyle ?? "accent");
  const [bannerSmall, setBannerSmall] = useState(profile.bannerSmall ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ banner: banner.slice(0, 5000) || null, bannerStyle: bannerStyle || undefined, bannerSmall });
  };
  const handleChange = () => onProfileChange({ ...profile, banner, bannerStyle, bannerSmall });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={labelClass}>
        ASCII art / text banner
        <textarea
          value={banner}
          onChange={(e) => { setBanner(e.target.value); handleChange(); }}
          className={`${inputClass} font-mono text-xs min-h-[120px]`}
          placeholder="Paste ASCII art here..."
          maxLength={5000}
          rows={6}
        />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={bannerSmall} onChange={(e) => { setBannerSmall(e.target.checked); handleChange(); }} />
        <span className="text-sm text-[var(--muted)]">Smaller font</span>
      </label>
      <div>
        <label className={labelClass}>Style</label>
        <select value={bannerStyle} onChange={(e) => { setBannerStyle(e.target.value); handleChange(); }} className={inputClass}>
          {["accent", "cyan", "green", "purple", "orange", "rose", "amber", "blue", "indigo", "teal", "sky", "fire"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <SaveButton />
    </form>
  );
}

function HeroPanel({
  profile,
  onSave,
  onProfileChange,
  hasPremium,
}: {
  profile: Profile;
  onSave: (f: Record<string, unknown>) => Promise<void>;
  onProfileChange: (p: Profile) => void;
  hasPremium?: boolean;
}) {
  const [name, setName] = useState(profile.name ?? "");
  const [tagline, setTagline] = useState(profile.tagline ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar ?? "");
  const [pronouns, setPronouns] = useState(profile.pronouns ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [nameGreeting, setNameGreeting] = useState(profile.nameGreeting ?? "");
  const [timezone, setTimezone] = useState(profile.timezone ?? "");
  const [timezoneRange, setTimezoneRange] = useState(profile.timezoneRange ?? "");
  const [birthdayMonth, setBirthdayMonth] = useState(() => {
    const b = profile.birthday;
    if (!b || !/^\d{2}-\d{2}$/.test(b)) return "";
    return b.slice(0, 2);
  });
  const [birthdayDay, setBirthdayDay] = useState(() => {
    const b = profile.birthday;
    if (!b || !/^\d{2}-\d{2}$/.test(b)) return "";
    return b.slice(3, 5);
  });
  const [languages, setLanguages] = useState(profile.languages ?? "");
  const [availability, setAvailability] = useState(profile.availability ?? "");
  const [currentFocus, setCurrentFocus] = useState(profile.currentFocus ?? "");
  const [showPageViews, setShowPageViews] = useState(profile.showPageViews ?? true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bday =
      birthdayMonth && birthdayDay && /^\d{2}$/.test(birthdayMonth) && /^\d{2}$/.test(birthdayDay)
        ? `${birthdayMonth}-${birthdayDay}`
        : undefined;
    onSave({
      name: name.slice(0, 100) || undefined,
      tagline: tagline.slice(0, 120) || undefined,
      avatarUrl: avatarUrl?.trim() || undefined,
      pronouns: pronouns.slice(0, 40) || undefined,
      location: location.slice(0, 80) || undefined,
      nameGreeting: nameGreeting.slice(0, 40) || undefined,
      timezone: timezone.slice(0, 64) || undefined,
      timezoneRange: timezoneRange.slice(0, 120) || undefined,
      birthday: bday ?? null,
      languages: languages.slice(0, 80) || undefined,
      availability: availability.slice(0, 60) || undefined,
      currentFocus: currentFocus.slice(0, 120) || undefined,
      showPageViews,
    });
  };
  const sync = (overrides?: Partial<{ name: string; tagline: string; avatarUrl: string; pronouns: string; location: string; nameGreeting: string; timezone: string; timezoneRange: string; birthdayMonth: string; birthdayDay: string; languages: string; availability: string; currentFocus: string; showPageViews: boolean }>) => {
    const bm = overrides?.birthdayMonth ?? birthdayMonth;
    const bd = overrides?.birthdayDay ?? birthdayDay;
    const bday = bm && bd && /^\d{2}$/.test(bm) && /^\d{2}$/.test(bd) ? `${bm}-${bd}` : undefined;
    onProfileChange({
      ...profile,
      name: overrides?.name ?? name,
      tagline: overrides?.tagline ?? tagline,
      avatar: (overrides?.avatarUrl ?? avatarUrl) || undefined,
      pronouns: overrides?.pronouns ?? pronouns,
      location: overrides?.location ?? location,
      nameGreeting: overrides?.nameGreeting ?? nameGreeting,
      timezone: (overrides?.timezone ?? timezone) || undefined,
      timezoneRange: (overrides?.timezoneRange ?? timezoneRange) || undefined,
      birthday: bday,
      languages: (overrides?.languages ?? languages) || undefined,
      availability: (overrides?.availability ?? availability) || undefined,
      currentFocus: (overrides?.currentFocus ?? currentFocus) || undefined,
      showPageViews: overrides?.showPageViews ?? showPageViews,
    });
  };

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setAvatarUploadError("Image must be 5 MB or smaller"); return; }
    setAvatarUploadError(null);
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "avatar");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) setAvatarUploadError(data.error ?? "Upload failed");
      else {
        const url = data.url?.startsWith("http") ? data.url : `${typeof window !== "undefined" ? window.location.origin : ""}${data.url || ""}`;
        setAvatarUrl(url);
        onProfileChange({ ...profile, avatar: url });
      }
    } finally {
      setAvatarUploading(false);
    }
  }, [profile, onProfileChange]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={labelClass}>
        Display name
        <input type="text" value={name} onChange={(e) => { const v = e.target.value; setName(v); sync({ name: v }); }} className={inputClass} maxLength={100} placeholder="Your name" />
      </label>
      <label className={labelClass}>
        Tagline
        <input type="text" value={tagline} onChange={(e) => { const v = e.target.value; setTagline(v); sync({ tagline: v }); }} className={inputClass} maxLength={120} placeholder="Short tagline" />
      </label>
      <label className={labelClass}>
        Greeting before name
        <input type="text" value={nameGreeting} onChange={(e) => { const v = e.target.value; setNameGreeting(v); sync({ nameGreeting: v }); }} className={inputClass} maxLength={40} placeholder="e.g. hi i'm, aka" />
      </label>
      <div>
        <label className={labelClass}>Avatar</label>
        <div className="flex gap-2 mt-1">
          <input type="url" value={avatarUrl} onChange={(e) => { const v = e.target.value; setAvatarUrl(v); sync({ avatarUrl: v }); }} className={inputClass} placeholder="https://... or upload" />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={avatarUploading} className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-hover)] disabled:opacity-50">
            <UploadSimple size={18} />
          </button>
        </div>
        {avatarUploadError && <p className="mt-1 text-xs text-[var(--warning)]">{avatarUploadError}</p>}
      </div>
      <label className={labelClass}>
        Pronouns
        <input type="text" value={pronouns} onChange={(e) => { const v = e.target.value; setPronouns(v); sync({ pronouns: v }); }} className={inputClass} maxLength={40} placeholder="e.g. they/them" />
      </label>
      <label className={labelClass}>
        Location
        <input type="text" value={location} onChange={(e) => { const v = e.target.value; setLocation(v); sync({ location: v }); }} className={inputClass} maxLength={80} placeholder="e.g. NYC, Berlin" />
      </label>
      <label className={labelClass}>
        Timezone <span className="text-[var(--muted)]/70">(IANA, e.g. America/New_York)</span>
        <input type="text" value={timezone} onChange={(e) => { const v = e.target.value; setTimezone(v); sync({ timezone: v }); }} className={inputClass} maxLength={64} placeholder="America/New_York" />
      </label>
      <label className={labelClass}>
        Availability window <span className="text-[var(--muted)]/70">(e.g. Usually 6pm–12am EST)</span>
        <input type="text" value={timezoneRange} onChange={(e) => { const v = e.target.value; setTimezoneRange(v); sync({ timezoneRange: v }); }} className={inputClass} maxLength={120} placeholder="When you're typically online" />
      </label>
      <label className={labelClass}>
        Birthday <span className="text-[var(--muted)]/70">(countdown on profile)</span>
        <div className="mt-1 flex gap-2">
          <select
            value={birthdayMonth}
            onChange={(e) => { const v = e.target.value; setBirthdayMonth(v); sync({ birthdayMonth: v }); }}
            className={inputClass}
          >
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => {
              const mm = String(i + 1).padStart(2, "0");
              const monthName = new Date(2000, i, 1).toLocaleString("default", { month: "long" });
              return (
                <option key={mm} value={mm}>
                  {monthName}
                </option>
              );
            })}
          </select>
          <select
            value={birthdayDay}
            onChange={(e) => { const v = e.target.value; setBirthdayDay(v); sync({ birthdayDay: v }); }}
            className={inputClass}
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => {
              const dd = String(i + 1).padStart(2, "0");
              return (
                <option key={dd} value={dd}>
                  {i + 1}
                </option>
              );
            })}
          </select>
        </div>
      </label>
      <label className={labelClass}>
        Languages <span className="text-[var(--muted)]/70">(e.g. EN, ES, FR)</span>
        <input type="text" value={languages} onChange={(e) => { const v = e.target.value; setLanguages(v); sync({ languages: v }); }} className={inputClass} maxLength={80} placeholder="Languages spoken" />
      </label>
      <label className={labelClass}>
        Availability <span className="text-[var(--muted)]/70">(e.g. Open to work, Open to collab)</span>
        <input type="text" value={availability} onChange={(e) => { const v = e.target.value; setAvailability(v); sync({ availability: v }); }} className={inputClass} maxLength={60} placeholder="Availability status" />
      </label>
      <label className={labelClass}>
        Current focus <span className="text-[var(--muted)]/70">(e.g. Working on X)</span>
        <input type="text" value={currentFocus} onChange={(e) => { const v = e.target.value; setCurrentFocus(v); sync({ currentFocus: v }); }} className={inputClass} maxLength={120} placeholder="What you're up to" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={showPageViews} onChange={(e) => { const v = e.target.checked; setShowPageViews(v); sync({ showPageViews: v }); }} />
        <span className="text-sm text-[var(--muted)]">Show page views</span>
      </label>
      <SaveButton />
    </form>
  );
}

function DescriptionPanel({ profile, onSave, onProfileChange, hasPremium }: { profile: Profile; onSave: (f: Record<string, unknown>) => Promise<void>; onProfileChange: (p: Profile) => void; hasPremium?: boolean }) {
  const [description, setDescription] = useState(profile.description ?? "");
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ description: description.slice(0, 2000) || undefined }); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={labelClass}>
        About you (Markdown supported)
        <textarea value={description} onChange={(e) => { setDescription(e.target.value); onProfileChange({ ...profile, description: e.target.value }); }} className={`${inputClass} min-h-[160px]`} maxLength={2000} placeholder="Write about yourself..." rows={8} />
      </label>
      <SaveButton />
    </form>
  );
}

function TagsPanel({ profile, onSave }: { profile: Profile; onSave: (f: Record<string, unknown>) => Promise<void> }) {
  const [tags, setTags] = useState((profile.tags ?? []).join(", "));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const arr = tags.split(",").map((s) => s.trim()).filter(Boolean);
    onSave({ tags: arr.length > 0 ? arr : undefined });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={labelClass}>
        Tags (comma-separated)
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} placeholder="Vibe Coder, LOTR, Coffee" />
      </label>
      <SaveButton />
    </form>
  );
}

function SkillsPanel({ profile, onSave }: { profile: Profile; onSave: (f: Record<string, unknown>) => Promise<void> }) {
  const [skills, setSkills] = useState((profile.skills ?? []).join(", "));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const arr = skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
    onSave({ skills: arr.length > 0 ? arr : undefined });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={labelClass}>
        Skills / roles (comma-separated, max 20)
        <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} className={inputClass} placeholder="Frontend, Design, 3D" />
      </label>
      <SaveButton />
    </form>
  );
}

function QuotePanel({ profile, onSave, onProfileChange }: { profile: Profile; onSave: (f: Record<string, unknown>) => Promise<void>; onProfileChange: (p: Profile) => void }) {
  const [quote, setQuote] = useState(profile.quote ?? "");
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ quote: quote.trim() || undefined }); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className={labelClass}>
        Quote / fun fact
        <textarea value={quote} onChange={(e) => { setQuote(e.target.value); onProfileChange({ ...profile, quote: e.target.value }); }} className={`${inputClass} min-h-[80px]`} placeholder="A memorable quote or fun fact about you" rows={3} />
      </label>
      <SaveButton />
    </form>
  );
}

function LinksPanel({ profileRow }: { profileRow: ProfileRow; profileId: string; onProfileChange: (p: Profile) => void }) {
  return (
    <div className="space-y-4">
      <DashboardLinks profile={profileRow} embedded />
    </div>
  );
}

function DiscordWidgetsPanel({
  profile,
  profileRow,
  onSave,
  onProfileChange,
}: {
  profile: Profile;
  profileRow: ProfileRow;
  onSave: (f: Record<string, unknown>) => Promise<void>;
  onProfileChange: (p: Profile) => void;
}) {
  const discordRaw = (profileRow as { showDiscordWidgets?: string }).showDiscordWidgets ?? "";
  const [accountAge, setAccountAge] = useState(discordRaw.includes("accountAge"));
  const [joined, setJoined] = useState(discordRaw.includes("joined"));
  const [serverCount, setServerCount] = useState(discordRaw.includes("serverCount"));
  const [serverInvite, setServerInvite] = useState(discordRaw.includes("serverInvite"));
  const [widgetsMatchAccent, setWidgetsMatchAccent] = useState(profile.widgetsMatchAccent ?? false);
  const [discordInviteUrl, setDiscordInviteUrl] = useState((profileRow as { discordInviteUrl?: string }).discordInviteUrl ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const widgets: string[] = [];
    if (accountAge) widgets.push("accountAge");
    if (joined) widgets.push("joined");
    if (serverCount) widgets.push("serverCount");
    if (serverInvite) widgets.push("serverInvite");
    onSave({
      showDiscordWidgets: widgets.length > 0 ? widgets.join(",") : null,
      widgetsMatchAccent,
      ...(serverInvite && { discordInviteUrl: discordInviteUrl.trim() || null }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--muted)]">Discord widgets</p>
        <label className="flex items-center gap-2"><input type="checkbox" checked={accountAge} onChange={(e) => setAccountAge(e.target.checked)} /><span className="text-sm">Account age</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={joined} onChange={(e) => setJoined(e.target.checked)} /><span className="text-sm">Joined date</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={serverCount} onChange={(e) => setServerCount(e.target.checked)} /><span className="text-sm">Server count</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={serverInvite} onChange={(e) => setServerInvite(e.target.checked)} /><span className="text-sm">Server invite</span></label>
      </div>
      {serverInvite && (
        <label className={labelClass}>
          Discord invite URL or code
          <input type="text" value={discordInviteUrl} onChange={(e) => setDiscordInviteUrl(e.target.value)} className={inputClass} placeholder="https://discord.gg/xxx or code" />
        </label>
      )}
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={widgetsMatchAccent} onChange={(e) => setWidgetsMatchAccent(e.target.checked)} />
        <span className="text-sm text-[var(--muted)]">Match profile accent color</span>
      </label>
      <SaveButton />
    </form>
  );
}

function RobloxWidgetsPanel({
  profile,
  profileRow,
  onSave,
}: {
  profile: Profile;
  profileRow: ProfileRow;
  onSave: (f: Record<string, unknown>) => Promise<void>;
  onProfileChange: (p: Profile) => void;
}) {
  const robloxRaw = (profileRow as { showRobloxWidgets?: string }).showRobloxWidgets ?? "";
  const [accountAge, setAccountAge] = useState(robloxRaw.includes("accountAge"));
  const [profileWidget, setProfileWidget] = useState(robloxRaw.includes("profile"));
  const [widgetsMatchAccent, setWidgetsMatchAccent] = useState(profile.widgetsMatchAccent ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const widgets: string[] = [];
    if (accountAge) widgets.push("accountAge");
    if (profileWidget) widgets.push("profile");
    onSave({ showRobloxWidgets: widgets.length > 0 ? widgets.join(",") : null, widgetsMatchAccent });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--muted)]">Roblox widgets (requires OAuth link)</p>
        <label className="flex items-center gap-2"><input type="checkbox" checked={accountAge} onChange={(e) => setAccountAge(e.target.checked)} /><span className="text-sm">Account age</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={profileWidget} onChange={(e) => setProfileWidget(e.target.checked)} /><span className="text-sm">Profile link</span></label>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={widgetsMatchAccent} onChange={(e) => setWidgetsMatchAccent(e.target.checked)} />
        <span className="text-sm text-[var(--muted)]">Match profile accent color</span>
      </label>
      <SaveButton />
    </form>
  );
}

function GalleryBlogPanel({ def }: { def: { label: string } }) {
  return (
    <InfoPanel
      title={def.label}
      text="Gallery and blog buttons appear here. Add images in Gallery and posts in Blog from the dashboard."
    />
  );
}

function AudioPanel({
  profile,
  onSave,
  onProfileChange,
}: {
  profile: Profile;
  onSave: (f: Record<string, unknown>) => Promise<void>;
  onProfileChange: (p: Profile) => void;
}) {
  const [showAudioPlayer, setShowAudioPlayer] = useState(profile.showAudioPlayer ?? false);
  const [tracks, setTracks] = useState<{ url: string; title?: string }[]>(() => {
    const raw = profile.audioTracks;
    if (Array.isArray(raw)) return raw;
    return [];
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      showAudioPlayer,
      audioTracks: tracks.length > 0 ? JSON.stringify(tracks) : null,
    });
  };

  const handleUpload = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "audio-player");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        const url = data.url?.startsWith("http") ? data.url : `${typeof window !== "undefined" ? window.location.origin : ""}${data.url || ""}`;
        setTracks((p) => [...p, { url, title: file.name.replace(/\.[^.]*$/, "") }]);
        onProfileChange({ ...profile, audioTracks: [...tracks, { url, title: file.name.replace(/\.[^.]*$/, "") }] });
      }
    } finally {
      setUploading(false);
    }
  }, [profile, tracks, onProfileChange]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={showAudioPlayer} onChange={(e) => { setShowAudioPlayer(e.target.checked); onProfileChange({ ...profile, showAudioPlayer: e.target.checked }); }} />
        <span className="text-sm text-[var(--muted)]">Show audio player</span>
      </label>
      <div>
        <label className={labelClass}>Tracks</label>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="mt-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-hover)]">
          <UploadSimple size={16} className="inline mr-1" /> Add track
        </button>
        {tracks.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {tracks.map((t, i) => (
              <li key={i} className="flex justify-between items-center">
                <span className="truncate">{t.title || t.url}</span>
                <button type="button" onClick={() => { const next = tracks.filter((_, j) => j !== i); setTracks(next); onProfileChange({ ...profile, audioTracks: next }); }} className="text-[var(--warning)] text-xs">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SaveButton />
    </form>
  );
}

const AVATAR_SHAPES = ["circle", "rounded", "square", "soft", "hexagon"] as const;
const LAYOUT_DENSITIES = ["default", "compact", "spacious"] as const;

function StylePanel({
  profile,
  onSave,
  onProfileChange,
  hasPremium,
}: {
  profile: Profile;
  onSave: (f: Record<string, unknown>) => Promise<void>;
  onProfileChange: (p: Profile) => void;
  hasPremium?: boolean;
}) {
  const [pageTheme, setPageTheme] = useState(profile.pageTheme ?? "classic-dark");
  const [accentColor, setAccentColor] = useState(profile.accentColor ?? "cyan");
  const [cardStyle, setCardStyle] = useState(profile.cardStyle ?? "default");
  const [cardOpacity, setCardOpacity] = useState(profile.cardOpacity ?? 95);
  const [cardBlur, setCardBlur] = useState(profile.cardBlur ?? "sm");
  const [animationPreset, setAnimationPreset] = useState(profile.animationPreset ?? "none");
  const [avatarShape, setAvatarShape] = useState(profile.avatarShape ?? "circle");
  const [layoutDensity, setLayoutDensity] = useState(profile.layoutDensity ?? "default");
  const [terminalPrompt, setTerminalPrompt] = useState(profile.terminalPrompt ?? "$");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      pageTheme: pageTheme || undefined,
      accentColor: hasPremium ? (accentColor || undefined) : undefined,
      cardStyle: cardStyle !== "default" ? cardStyle : undefined,
      cardOpacity: cardOpacity !== 95 ? cardOpacity : undefined,
      cardBlur: cardBlur !== "sm" ? cardBlur : undefined,
      animationPreset: animationPreset !== "none" ? animationPreset : undefined,
      avatarShape: avatarShape !== "circle" ? avatarShape : undefined,
      layoutDensity: layoutDensity !== "default" ? layoutDensity : undefined,
      terminalPrompt: (terminalPrompt?.trim() || "$").slice(0, 8) || undefined,
    });
  };
  const sync = () => onProfileChange({ ...profile, pageTheme, accentColor, cardStyle, cardOpacity, cardBlur, animationPreset, avatarShape, layoutDensity, terminalPrompt: terminalPrompt?.trim() || "$" });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Page theme</label>
        <select value={pageTheme} onChange={(e) => { const v = e.target.value as Profile["pageTheme"]; setPageTheme(v ?? "classic-dark"); sync(); }} className={inputClass}>
          <option value="classic-dark">Classic dark</option>
          <option value="classic-light">Classic light</option>
          <option value="minimalist-dark">Minimalist dark</option>
          <option value="minimalist-light">Minimalist light</option>
          <option value="professional-dark">Professional dark</option>
          <option value="professional-light">Professional light</option>
        </select>
      </div>
      {hasPremium && (
        <div>
          <label className={labelClass}>Accent color</label>
          <select value={accentColor} onChange={(e) => { setAccentColor(e.target.value); sync(); }} className={inputClass}>
            {ACCENT_THEMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className={labelClass}>Card style</label>
        <select value={cardStyle} onChange={(e) => { setCardStyle(e.target.value); sync(); }} className={inputClass}>
          <option value="default">Default</option>
          <option value="sharp">Sharp</option>
          <option value="glass">Glass</option>
          <option value="neon">Neon</option>
          <option value="minimal">Minimal</option>
          <option value="elevated">Elevated</option>
        </select>
      </div>
      <label className={labelClass}>
        Card opacity ({cardOpacity}%)
        <input type="range" min={50} max={100} value={cardOpacity} onChange={(e) => { setCardOpacity(parseInt(e.target.value, 10)); sync(); }} className="mt-1 block w-full" />
      </label>
      <div>
        <label className={labelClass}>Card blur</label>
        <select value={cardBlur} onChange={(e) => { const v = e.target.value as Profile["cardBlur"]; setCardBlur(v ?? "sm"); sync(); }} className={inputClass}>
          <option value="none">None</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Entry animation</label>
        <select value={animationPreset} onChange={(e) => { setAnimationPreset(e.target.value); sync(); }} className={inputClass}>
          <option value="none">None</option>
          <option value="fade-in">Fade in</option>
          <option value="slide-up">Slide up</option>
          <option value="scale-in">Scale in</option>
          <option value="glow">Glow</option>
          <option value="shimmer">Shimmer</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Avatar shape</label>
        <select value={avatarShape} onChange={(e) => { setAvatarShape(e.target.value); sync(); }} className={inputClass}>
          {AVATAR_SHAPES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Layout density</label>
        <select value={layoutDensity} onChange={(e) => { setLayoutDensity(e.target.value); sync(); }} className={inputClass}>
          {LAYOUT_DENSITIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <label className={labelClass}>
        Terminal prompt
        <input type="text" value={terminalPrompt} onChange={(e) => { setTerminalPrompt(e.target.value); sync(); }} className={inputClass} maxLength={8} placeholder="$" />
      </label>
      <p className="text-xs text-[var(--muted)] pt-2">
        <Link href="/dashboard" className="text-[var(--accent)] hover:underline">Full editor</Link> for background, fonts, cursor, and more.
      </p>
      <SaveButton />
    </form>
  );
}

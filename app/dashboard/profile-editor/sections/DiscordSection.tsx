"use client";

import { DiscordLogo } from "@phosphor-icons/react";
import SearchableSelect from "@/app/components/SearchableSelect";
import type { ProfileRow } from "@/lib/db/schema";
import { getDiscordBadgeInfo } from "@/lib/discord-badges";

export interface DiscordSectionProps {
  visible: boolean;
  profile: ProfileRow;
  availableDiscordBadges: string[];
}

export function DiscordSection({ visible, profile, availableDiscordBadges }: DiscordSectionProps) {
  return (
    <div className={visible ? "block space-y-4" : "hidden"}>
      {/* Discord badges */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <div className="rounded-lg bg-[#5865F2]/10 p-1.5">
            <DiscordLogo size={18} weight="fill" className="text-[#5865F2]" aria-hidden />
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">Discord badges</span>
        </div>
        <div className="p-4 space-y-2">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--foreground)]">
            <input type="checkbox" name="showDiscordBadges" defaultChecked={profile.showDiscordBadges ?? false} className="rounded border-[var(--border)]" />
            Show my Discord badges on profile <span className="text-[var(--muted)]/70">(Staff, Partner, HypeSquad, etc.)</span>
          </label>
          {availableDiscordBadges.length > 0 && (
            <input type="hidden" name="availableDiscordBadgeKeys" value={availableDiscordBadges.join(",")} />
          )}
          {profile.showDiscordBadges && availableDiscordBadges.length > 0 && (
            <div className="ml-4 mt-2 space-y-1.5 rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/40 p-3">
              <p className="text-xs font-medium text-[var(--muted)] mb-1.5">Choose which badges to show</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {availableDiscordBadges.map((key) => {
                  const info = getDiscordBadgeInfo(key);
                  const hidden = (profile as { hiddenDiscordBadges?: string }).hiddenDiscordBadges
                    ?.split(",")
                    .map((s) => s.trim().toLowerCase())
                    .includes(key.toLowerCase());
                  return (
                    <label key={key} className="inline-flex items-center gap-2 cursor-pointer text-xs text-[var(--foreground)]">
                      <input
                        type="checkbox"
                        name={`showDiscordBadge_${key}`}
                        defaultChecked={!hidden}
                        className="rounded border-[var(--border)]"
                      />
                      {info?.label ?? key}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <p className="text-xs text-amber-600 dark:text-amber-500">
            ⚠️ Discord badge display is currently broken; some badges (e.g. Nitro) may not show reliably.
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <div className="rounded-lg bg-[#5865F2]/10 p-1.5">
            <DiscordLogo size={18} weight="fill" className="text-[#5865F2]" aria-hidden />
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">Discord presence</span>
        </div>
        <div className="p-4 space-y-2">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--foreground)]">
            <input
              type="checkbox"
              name="showDiscordPresence"
              defaultChecked={(profile as { showDiscordPresence?: boolean }).showDiscordPresence !== false}
              className="rounded border-[var(--border)]"
            />
            Show Discord presence
          </label>
          <p className="text-xs text-[var(--muted)]">
            {`When enabled and you're in our Discord server, your live status (online/idle/busy) and Rich Presence (e.g. "Playing X") appear on your profile.`}
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-[var(--warning)] rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2.5 py-1.5" role="note">
            <span aria-hidden>⚠️</span>
            You must be in the same Discord server as the bot for this to work.
          </p>
          <label className="block pt-2 text-xs font-medium text-[var(--muted)]">
            Display style
            <div className="mt-1">
              <SearchableSelect
                name="discordPresenceStyle"
                defaultValue={(profile as { discordPresenceStyle?: string }).discordPresenceStyle ?? "widget"}
                options={[
                  { value: "widget", label: "Widget — unified card (default)" },
                  { value: "pills", label: "Pills — status pill + activity pills" },
                  { value: "minimal", label: "Minimal — dot and compact text" },
                  { value: "stacked", label: "Stacked — status + activities as cards" },
                  { value: "inline", label: "Inline — single condensed row" },
                ]}
                searchThreshold={10}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  DiscordLogo,
  SquaresFour,
  CalendarBlank,
  Buildings,
  ArrowSquareOut,
  Coins,
  GithubLogo,
} from "@phosphor-icons/react";
import DiscordWidgetsDisplay from "@/app/components/DiscordWidgetsDisplay";
import RobloxWidgetsDisplay from "@/app/components/RobloxWidgetsDisplay";
import CryptoWidgetsDisplay from "@/app/components/CryptoWidgetsDisplay";
import GithubWidgetsDisplay from "@/app/components/GithubWidgetsDisplay";
import type { CryptoWidgetData } from "@/lib/crypto-widgets";
import type { GithubWidgetData } from "@/lib/github-widgets";
import { CRYPTO_WALLET_CHAINS } from "@/lib/crypto-widgets";
import type { DiscordWidgetData } from "@/lib/discord-widgets";
import type { ProfileRow } from "@/lib/db/schema";
import type { Profile } from "@/lib/profiles";
import { MAX_WIDGETS } from "@/app/dashboard/profile-editor/constants";

export interface WidgetsSectionProps {
  visible: boolean;
  profile: ProfileRow;
  baseProfileForPreview: Profile | undefined;
  robloxLinked: boolean;
  widgetPreviewFiltered: DiscordWidgetData | null;
  widgetsMatchAccent: boolean;
  setWidgetsMatchAccent: (v: boolean) => void;
  widgetCount: number;
  canEnableMore: boolean;
  widgetAccountAge: boolean;
  setWidgetAccountAge: (v: boolean) => void;
  widgetJoined: boolean;
  setWidgetJoined: (v: boolean) => void;
  widgetServerCount: boolean;
  setWidgetServerCount: (v: boolean) => void;
  widgetServerInvite: boolean;
  setWidgetServerInvite: (v: boolean) => void;
  widgetRobloxAccountAge: boolean;
  setWidgetRobloxAccountAge: (v: boolean) => void;
  widgetRobloxProfile: boolean;
  setWidgetRobloxProfile: (v: boolean) => void;
  githubUsernameInput: string;
  setGithubUsernameInput: (v: string) => void;
  widgetGithubLastPush: boolean;
  setWidgetGithubLastPush: (v: boolean) => void;
  widgetGithubPublicRepos: boolean;
  setWidgetGithubPublicRepos: (v: boolean) => void;
  widgetGithubContributions: boolean;
  setWidgetGithubContributions: (v: boolean) => void;
  widgetGithubProfile: boolean;
  setWidgetGithubProfile: (v: boolean) => void;
  cryptoWalletChain: string;
  setCryptoWalletChain: (v: string) => void;
  cryptoWalletAddress: string;
  setCryptoWalletAddress: (v: string) => void;
  discordInviteInput: string;
  setDiscordInviteInput: (v: string) => void;
  githubPreviewFiltered: GithubWidgetData | null;
  selectedGithubWidgetsCsv: string;
  cryptoPreviewData: CryptoWidgetData | null;
}

export function WidgetsSection(props: WidgetsSectionProps) {
  const {
    visible,
    profile,
    baseProfileForPreview,
    robloxLinked,
    widgetPreviewFiltered,
    widgetsMatchAccent,
    setWidgetsMatchAccent,
    widgetCount,
    canEnableMore,
    widgetAccountAge,
    setWidgetAccountAge,
    widgetJoined,
    setWidgetJoined,
    widgetServerCount,
    setWidgetServerCount,
    widgetServerInvite,
    setWidgetServerInvite,
    widgetRobloxAccountAge,
    setWidgetRobloxAccountAge,
    widgetRobloxProfile,
    setWidgetRobloxProfile,
    githubUsernameInput,
    setGithubUsernameInput,
    widgetGithubLastPush,
    setWidgetGithubLastPush,
    widgetGithubPublicRepos,
    setWidgetGithubPublicRepos,
    widgetGithubContributions,
    setWidgetGithubContributions,
    widgetGithubProfile,
    setWidgetGithubProfile,
    cryptoWalletChain,
    setCryptoWalletChain,
    cryptoWalletAddress,
    setCryptoWalletAddress,
    discordInviteInput,
    setDiscordInviteInput,
    githubPreviewFiltered,
    selectedGithubWidgetsCsv,
    cryptoPreviewData,
  } = props;
  return (
    <div className={visible ? "block space-y-4" : "hidden"}>
      {/* Widgets — Discord, Dread.lol, Roblox, GitHub (max 4 total; crypto separate) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden transition-all hover:border-[var(--border-bright)]">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[var(--accent)]/10 p-1.5">
              <SquaresFour size={18} weight="regular" className="text-[var(--accent)]" aria-hidden />
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">Widgets</span>
          </div>
          <span className="text-xs text-[var(--muted)]">
            {widgetCount} of {MAX_WIDGETS} selected
          </span>
        </div>
        <div className="p-4 space-y-5">
          <p className="text-xs text-[var(--muted)]">
            Info cards appear on your profile. Choose up to {MAX_WIDGETS} total across all sources.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="widgetsMatchAccent"
              checked={widgetsMatchAccent}
              onChange={(e) => setWidgetsMatchAccent(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span className="text-sm font-medium text-[var(--foreground)]">Match accent color</span>
          </label>
          <p className="text-[11px] text-[var(--muted)] -mt-3">
            When on, widgets use your profile accent color instead of brand colors.
          </p>
          {(() => {
            const WidgetCheckbox = ({
              id,
              checked,
              setChecked,
              name,
              icon,
              label,
              desc,
              accent,
            }: {
              id: string;
              checked: boolean;
              setChecked: (v: boolean) => void;
              name: string;
              icon: React.ReactNode;
              label: string;
              desc: string;
              accent: "discord" | "site" | "roblox" | "github";
            }) => (
              <label
                key={id}
                className={`flex items-start gap-3 rounded-lg border px-3 py-3 cursor-pointer transition-colors ${
                  checked
                    ? accent === "discord"
                      ? "border-[#5865F2]/40 bg-[#5865F2]/10"
                      : accent === "roblox"
                        ? "border-[#00A2FF]/40 bg-[#00A2FF]/10"
                        : accent === "github"
                          ? "border-[#30363d]/50 bg-[#161b22]/40"
                          : "border-[var(--accent)]/40 bg-[var(--accent)]/10"
                    : canEnableMore
                      ? "border-[var(--border)]/60 hover:border-[var(--border)]"
                      : "border-[var(--border)]/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  name={name}
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked && !canEnableMore) return;
                    setChecked(e.target.checked);
                  }}
                  disabled={!checked && !canEnableMore}
                  className="mt-1 rounded border-[var(--border)]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--muted)]">{desc}</p>
                </div>
              </label>
            );
            return (
              <>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5865F2] mb-2">Discord</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <WidgetCheckbox
                      id="accountAge"
                      checked={widgetAccountAge}
                      setChecked={setWidgetAccountAge}
                      name="showDiscordWidgetAccountAge"
                      icon={<DiscordLogo size={18} weight="fill" className="shrink-0 text-[#5865F2]" aria-hidden />}
                      label="Account age"
                      desc="How long you've had your Discord account"
                      accent="discord"
                    />
                    <WidgetCheckbox
                      id="serverCount"
                      checked={widgetServerCount}
                      setChecked={setWidgetServerCount}
                      name="showDiscordWidgetServerCount"
                      icon={<Buildings size={18} weight="regular" className="shrink-0 text-[#5865F2]" aria-hidden />}
                      label="Server count"
                      desc="Number of Discord servers you're in"
                      accent="discord"
                    />
                    <WidgetCheckbox
                      id="serverInvite"
                      checked={widgetServerInvite}
                      setChecked={setWidgetServerInvite}
                      name="showDiscordWidgetServerInvite"
                      icon={<ArrowSquareOut size={18} weight="regular" className="shrink-0 text-[#5865F2]" aria-hidden />}
                      label="Server invite"
                      desc="Link for visitors to join your Discord"
                      accent="discord"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">Dread.lol</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <WidgetCheckbox
                      id="joined"
                      checked={widgetJoined}
                      setChecked={setWidgetJoined}
                      name="showDiscordWidgetJoined"
                      icon={<CalendarBlank size={18} weight="regular" className="shrink-0 text-[var(--accent)]" aria-hidden />}
                      label="Joined"
                      desc="When you signed up for Dread.lol"
                      accent="site"
                    />
                  </div>
                </div>
                {robloxLinked ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#00A2FF] mb-2">Roblox</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <WidgetCheckbox
                        id="robloxAccountAge"
                        checked={widgetRobloxAccountAge}
                        setChecked={setWidgetRobloxAccountAge}
                        name="showRobloxWidgetAccountAge"
                        icon={
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#00A2FF]" aria-hidden>
                            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.09 8 12 11.82 4.91 8 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
                          </svg>
                        }
                        label="Account age"
                        desc="How long you've had your Roblox account"
                        accent="roblox"
                      />
                      <WidgetCheckbox
                        id="robloxProfile"
                        checked={widgetRobloxProfile}
                        setChecked={setWidgetRobloxProfile}
                        name="showRobloxWidgetProfile"
                        icon={
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#00A2FF]" aria-hidden>
                            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.09 8 12 11.82 4.91 8 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
                          </svg>
                        }
                        label="Profile link"
                        desc="Link to your Roblox profile"
                        accent="roblox"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#00A2FF] mb-2">Roblox</p>
                    <Link
                      href="/api/auth/roblox"
                      className="inline-flex items-center gap-2.5 rounded-lg border border-[#00A2FF]/40 bg-[#00A2FF]/15 px-4 py-2.5 text-sm font-medium text-[#00A2FF] transition-colors hover:border-[#00A2FF]/60 hover:bg-[#00A2FF]/20"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.09 8 12 11.82 4.91 8 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
                      </svg>
                      Link Roblox for 2 more widget options
                    </Link>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8b949e] mb-2">GitHub</p>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-2">
                    Username
                    <input
                      type="text"
                      name="githubUsername"
                      value={githubUsernameInput}
                      onChange={(e) => setGithubUsernameInput(e.target.value)}
                      autoComplete="off"
                      placeholder="octocat"
                      className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      maxLength={39}
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <WidgetCheckbox
                      id="githubLastPush"
                      checked={widgetGithubLastPush}
                      setChecked={setWidgetGithubLastPush}
                      name="showGithubWidgetLastPush"
                      icon={<GithubLogo size={18} weight="fill" className="shrink-0 text-[#f0f6fc]" aria-hidden />}
                      label="Last push"
                      desc="Relative time of your latest public repo activity"
                      accent="github"
                    />
                    <WidgetCheckbox
                      id="githubPublicRepos"
                      checked={widgetGithubPublicRepos}
                      setChecked={setWidgetGithubPublicRepos}
                      name="showGithubWidgetPublicRepos"
                      icon={<GithubLogo size={18} weight="fill" className="shrink-0 text-[#f0f6fc]" aria-hidden />}
                      label="Public repos"
                      desc="Count of public repositories"
                      accent="github"
                    />
                    <WidgetCheckbox
                      id="githubContributions"
                      checked={widgetGithubContributions}
                      setChecked={setWidgetGithubContributions}
                      name="showGithubWidgetContributions"
                      icon={<GithubLogo size={18} weight="fill" className="shrink-0 text-[#f0f6fc]" aria-hidden />}
                      label="Contributions"
                      desc="Year total + last 4 weeks heatmap (needs server token)"
                      accent="github"
                    />
                    <WidgetCheckbox
                      id="githubProfile"
                      checked={widgetGithubProfile}
                      setChecked={setWidgetGithubProfile}
                      name="showGithubWidgetProfile"
                      icon={<GithubLogo size={18} weight="fill" className="shrink-0 text-[#f0f6fc]" aria-hidden />}
                      label="Profile link"
                      desc="Link to your GitHub profile"
                      accent="github"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--muted)] mt-2">
                    Public GitHub API (cached ~1h). Contribution graph uses GraphQL and requires{" "}
                    <code className="text-[10px]">GITHUB_TOKEN</code> in production. Counts toward the {MAX_WIDGETS} widget cap with Discord and Roblox.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                    <Coins size={16} weight="duotone" className="shrink-0" aria-hidden />
                    Wallet balance
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mb-2">
                    Native balance for one address on Ethereum, Bitcoin, or Solana (public chain data; may be delayed). Separate from the {MAX_WIDGETS}{" "}
                    Discord/Roblox/GitHub widgets above.
                  </p>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                    Network
                    <select
                      name="cryptoWalletChain"
                      value={cryptoWalletChain}
                      onChange={(e) => setCryptoWalletChain(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    >
                      <option value="">None</option>
                      {CRYPTO_WALLET_CHAINS.map((c) => (
                        <option key={c} value={c}>
                          {c === "ethereum" ? "Ethereum" : c === "bitcoin" ? "Bitcoin" : "Solana"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1 mt-2">
                    Address
                    <input
                      type="text"
                      name="cryptoWalletAddress"
                      value={cryptoWalletAddress}
                      onChange={(e) => setCryptoWalletAddress(e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="0x… / bc1… / Solana address"
                      className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      maxLength={128}
                    />
                  </label>
                </div>
              </>
            );
          })()}
          {widgetServerInvite && (
            <label className="block pt-1">
              <span className="text-xs font-medium text-[var(--muted)]">Discord invite link</span>
              <input
                type="text"
                name="discordInviteUrl"
                value={discordInviteInput}
                onChange={(e) => setDiscordInviteInput(e.target.value)}
                placeholder="https://discord.gg/abc123 or abc123"
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {discordInviteInput.trim() && !/^(https?:\/\/)?(discord\.gg\/|discord\.com\/invite\/)[a-zA-Z0-9-]+$|^[a-zA-Z0-9-]{2,32}$/.test(
                discordInviteInput.trim()
              ) && (
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-500">
                  Use a valid Discord invite (e.g. discord.gg/abc123)
                </p>
              )}
            </label>
          )}
          {robloxLinked && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border)]/50">
              <span className="text-xs text-[var(--terminal)]">✓ Roblox linked</span>
              <Link href="/api/auth/roblox" className="text-xs text-[#00A2FF] hover:underline">
                Re-link
              </Link>
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Unlink Roblox? You can re-link anytime.")) {
                    const res = await fetch(`/api/profiles/${profile.slug}/roblox/disconnect`, { method: "DELETE" });
                    if (res.ok) window.location.reload();
                  }
                }}
                className="text-xs text-[var(--muted)] hover:text-[var(--warning)]"
              >
                Unlink
              </button>
            </div>
          )}
          {(widgetPreviewFiltered ||
            ((widgetRobloxAccountAge || widgetRobloxProfile) && baseProfileForPreview?.robloxWidgets) ||
            githubPreviewFiltered ||
            (cryptoPreviewData && cryptoPreviewData.address)) && (
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] mb-2">Preview</p>
              <div className="rounded-lg border border-[var(--border)]/50 bg-[var(--bg)]/60 p-3 space-y-3">
                {widgetPreviewFiltered && <DiscordWidgetsDisplay data={widgetPreviewFiltered} matchAccent={widgetsMatchAccent} />}
                {(widgetRobloxAccountAge || widgetRobloxProfile) && baseProfileForPreview?.robloxWidgets && (
                  <RobloxWidgetsDisplay
                    data={{
                      ...(widgetRobloxAccountAge && baseProfileForPreview.robloxWidgets.accountAge
                        ? { accountAge: baseProfileForPreview.robloxWidgets.accountAge }
                        : {}),
                      ...(widgetRobloxProfile && baseProfileForPreview.robloxWidgets.profile
                        ? { profile: baseProfileForPreview.robloxWidgets.profile }
                        : {}),
                    }}
                    matchAccent={widgetsMatchAccent}
                  />
                )}
                {githubPreviewFiltered && (
                  <GithubWidgetsDisplay
                    data={githubPreviewFiltered}
                    matchAccent={widgetsMatchAccent}
                    orderFromCsv={selectedGithubWidgetsCsv}
                  />
                )}
                {cryptoPreviewData && cryptoPreviewData.address && (
                  <CryptoWidgetsDisplay data={cryptoPreviewData} matchAccent={widgetsMatchAccent} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

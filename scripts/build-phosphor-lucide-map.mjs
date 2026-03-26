#!/usr/bin/env node
/**
 * Builds lib/legacy-phosphor-to-lucide-map.generated.ts from lib/phosphor-icon-names.ts
 * and lucide-react exports. Run once before removing phosphor-icon-names.ts, or keep
 * phosphor list embedded below.
 */
import * as Lucide from "lucide-react";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const all = Object.keys(Lucide);
const lucideSet = new Set();
for (const k of all) {
  if (!/^[A-Z]/.test(k)) continue;
  if (k.startsWith("Lucide") && k.length > 6) {
    const without = k.slice(6);
    if (all.includes(without)) continue;
  }
  if (k.endsWith("Icon") && k !== "LucideIcon") {
    const base = k.slice(0, -4);
    if (all.includes(base)) continue;
  }
  const v = Lucide[k];
  if (typeof v !== "object" || v === null || !v.$$typeof) continue;
  if (typeof v.render !== "function") continue;
  lucideSet.add(k);
}

const phosphorSrc = readFileSync(join(root, "scripts/phosphor-icon-names.snapshot.ts"), "utf8");
const phosphorNames = [...phosphorSrc.matchAll(/"([A-Za-z][A-Za-z0-9]*)"/g)]
  .map((m) => m[1])
  .filter((n, i, a) => a.indexOf(n) === i);

/** Manual overrides where heuristics fail */
const MANUAL = {
  Award: "Medal",
  ArrowSquareOut: "ExternalLink",
  MagnifyingGlass: "Search",
  FloppyDisk: "Save",
  PencilSimple: "Pencil",
  GearSix: "Settings",
  ImagesSquare: "Images",
  CaretRight: "ChevronRight",
  CaretLeft: "ChevronLeft",
  CaretDown: "ChevronDown",
  CaretUp: "ChevronUp",
  SealCheck: "BadgeCheck",
  Article: "Newspaper",
  SignOut: "LogOut",
  SignIn: "LogIn",
  Pulse: "Activity",
  ClockCounterClockwise: "History",
  ArrowCounterClockwise: "RotateCcw",
  ListChecks: "ListTodo",
  SquaresFour: "LayoutGrid",
  Buildings: "Building2",
  CalendarBlank: "Calendar",
  UploadSimple: "Upload",
  LinkSimple: "Link",
  Eyedropper: "Pipette",
  Prohibit: "Ban",
  ShieldWarning: "ShieldAlert",
  Storefront: "Store",
  SortAscending: "ArrowUpNarrowWide",
  Notebook: "BookOpen",
  ListMagnifyingGlass: "Search",
  FileMagnifyingGlass: "FileSearch",
  ChatCentered: "MessageSquare",
  ChatCircle: "MessageCircle",
  DotsThree: "MoreHorizontal",
  DotsThreeVertical: "MoreVertical",
  DotsNine: "Grip",
  TwitterLogo: "Twitter",
  YoutubeLogo: "Youtube",
  InstagramLogo: "Instagram",
  TwitchLogo: "Twitch",
  SpotifyLogo: "Music",
  LinkedinLogo: "Linkedin",
  RedditLogo: "CircleDot",
  SteamLogo: "Gamepad2",
  PaypalLogo: "Wallet",
  TelegramLogo: "Send",
  PatreonLogo: "HeartHandshake",
  MediumLogo: "Rss",
  MastodonLogo: "Milestone",
  BehanceLogo: "Palette",
  FigmaLogo: "Figma",
  NotionLogo: "StickyNote",
  CodepenLogo: "Codepen",
  DevToLogo: "BookOpen",
  SoundcloudLogo: "Cloud",
  PinterestLogo: "Pin",
  ThreadsLogo: "AtSign",
  WhatsappLogo: "MessageCircle",
  GithubLogo: "Github",
  DiscordLogo: "MessageCircle",
  XLogo: "Twitter",
  CopySimple: "Copy",
  TrashSimple: "Trash2",
  WarningCircle: "AlertCircle",
  CheckCircle: "CircleCheck",
  Envelope: "Mail",
  Megaphone: "Megaphone",
  Fingerprint: "Fingerprint",
  Medal: "Medal",
  PhosphorLogo: "Sparkles",
  NyTimesLogo: "Newspaper",
  OpenAiLogo: "Bot",
  StackOverflowLogo: "Library",
  FediverseLogo: "Globe",
  PixLogo: "Sparkle",
  ReadCvLogo: "FileText",
  StripeLogo: "CreditCard",
  TidalLogo: "Waves",
  WebhooksLogo: "Webhook",
  WechatLogo: "MessageCircle",
  SnapchatLogo: "Ghost",
  SkypeLogo: "Phone",
  SlackLogo: "MessageSquare",
  SketchLogo: "PenTool",
  ReplitLogo: "Terminal",
  FramerLogo: "Layout",
  DropboxLogo: "Cloud",
  DribbbleLogo: "Circle",
  FacebookLogo: "Facebook",
  AndroidLogo: "Smartphone",
  AppleLogo: "Apple",
  WindowsLogo: "AppWindow",
  LinuxLogo: "Terminal",
  GoogleLogo: "Chrome",
  AmazonLogo: "ShoppingBag",
  AngularLogo: "Triangle",
  AppStoreLogo: "AppWindow",
  MicrosoftExcelLogo: "FileSpreadsheet",
  MicrosoftWordLogo: "FileText",
  MicrosoftPowerpointLogo: "Presentation",
  MicrosoftOutlookLogo: "Mail",
  MicrosoftTeamsLogo: "Users",
  CodaLogo: "FileText",
  MarkdownLogo: "FileText",
  MatrixLogo: "Grid3x3",
  MetaLogo: "Globe",
  MessengerLogo: "MessageCircle",
  LinktreeLogo: "Link",
  GoodreadsLogo: "BookOpen",
  GooglePodcastsLogo: "Podcast",
  GooglePhotosLogo: "Image",
  GoogleDriveLogo: "Cloud",
  GoogleChromeLogo: "Chrome",
  GoogleCardboardLogo: "Box",
  GooglePlayLogo: "Play",
  FediverseLogo: "Globe",
  FinnTheHuman: "User",
  FalloutShelter: "Home",
  PhosphorLogo: "Sparkles",
};

function mapName(p) {
  if (p === "Award") return "Medal";
  if (MANUAL[p]) return MANUAL[p];
  if (lucideSet.has(p)) return p;
  if (p.endsWith("Logo")) {
    const base = p.slice(0, -4);
    if (lucideSet.has(base)) return base;
    if (lucideSet.has(base + "Icon")) return base + "Icon";
  }
  if (p.endsWith("Simple")) {
    const base = p.slice(0, -6);
    if (lucideSet.has(base)) return base;
  }
  const noLogo = p.replace(/Logo$/, "");
  if (noLogo !== p && lucideSet.has(noLogo)) return noLogo;
  const camel = p
    .replace(/ArrowSquareOut/g, "ExternalLink")
    .replace(/MagnifyingGlass/g, "Search");
  if (camel !== p && lucideSet.has(camel)) return camel;
  return "CircleHelp";
}

const entries = phosphorNames.map((p) => {
  const l = mapName(p);
  return p === l ? null : [p, l];
}).filter(Boolean);

const unique = new Map(entries);
const lines = [...unique.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([p, l]) => `  "${p}": "${l}",`);

const out = `/**
 * Maps historical Phosphor PascalCase icon names (stored in MongoDB) to Lucide component names.
 * Generated by scripts/build-phosphor-lucide-map.mjs — only entries that differ from identity are listed.
 */
export const PHOSPHOR_TO_LUCIDE_ICON: Record<string, string> = {
${lines.join("\n")}
};
`;

writeFileSync(join(root, "lib/legacy-phosphor-to-lucide-map.generated.ts"), out, "utf8");
console.log(`Wrote lib/legacy-phosphor-to-lucide-map.generated.ts (${unique.size} mappings, ${phosphorNames.length} phosphor names)`);

// sanity: all phosphor map to valid lucide
let bad = 0;
for (const p of phosphorNames) {
  const l = mapName(p);
  if (!lucideSet.has(l)) {
    console.warn("Invalid target:", p, "->", l);
    bad++;
  }
}
if (bad) process.exit(1);

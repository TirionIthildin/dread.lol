/**
 * Profile pages for friends. Add or edit entries here.
 */
export interface Profile {
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  /** Profile avatar image URL (e.g. Discord CDN). */
  avatar?: string;
  /** Optional ASCII banner shown at top of profile (e.g. KLASSY art). */
  banner?: string;
  /** Discord username (e.g. @qwe301). Click-to-copy. */
  discord?: string;
  /** Roblox profile URL. Link opens in new tab. */
  roblox?: string;
  /** When true, the bat 🦇 in description is clickable and shows an easter egg. */
  easterEgg?: boolean;
}

export const PROFILES: Profile[] = [
  {
    slug: "klass",
    name: "Klass",
    tagline: "long as the outcome is income",
    description:
      "Professional hustler. 🦇",
    easterEgg: true,
    avatar:
      "https://cdn.discordapp.com/avatars/712435421518233600/7612ad22adcc91ec60e9f7430e1be57b.webp",
    banner: `██╗░░██╗██╗░░░░░░█████╗░░██████╗░██████╗███╗░░██╗░█████╗░████████╗
██║░██╔╝██║░░░░░██╔══██╗██╔════╝██╔════╝████╗░██║██╔══██╗╚══██╔══╝
█████═╝░██║░░░░░███████║╚█████╗░╚█████╗░██╔██╗██║██║░░██║░░░██║░░░
██╔═██╗░██║░░░░░██╔══██║░╚═══██╗░╚═══██╗██║╚████║██║░░██║░░░██║░░░
██║░╚██╗███████╗██║░░██║██████╔╝██████╔╝██║░╚███║╚█████╔╝░░░██║░░░
╚═╝░░╚═╝╚══════╝╚═╝░░╚═╝╚═════╝░╚═════╝░╚═╝░░╚══╝░╚════╝░░░░╚═╝░░░`,
    discord: "@qwe301",
    roblox: "https://www.roblox.com/users/1553094661/profile",
  },
  {
    slug: "balatro",
    name: "Balatro",
    tagline: "I became insane, with long intervals of horrible sanity",
    description:
      "Larp communities since 2019.",
    discord: "@fluffynuttts_exodus",
    banner: `⢠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠸⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢣⠈⠻⣿⣷⣦⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⣄⠀
⢸⣶⣄⡀⠉⡝⣽⣿⣾⣦⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣧⠀
⢰⠙⢿⣿⣷⣶⣏⣙⡛⠿⢿⣿⣿⣿⣶⣶⣀⣀⣰⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⣰⣿⢏⡆
⠈⢷⣤⡈⠙⠻⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣾⣾⣤⣴⣶⣿⠿⢋⡾⠀
⠀⠀⠻⣿⣷⣦⣤⣤⣈⣩⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⣀⣼⣿⣿⣿⣿⣿⣿⣿⣧⣦⡷⠁⠀
⠀⠀⠙⢦⣍⣉⡛⠻⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡄⠀⠀⠀⠀⠀⣰⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⠵⠂⠀⠀
⠀⠀⠀⠀⠉⠛⠻⠿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⠉⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠼⡿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣶⣾⣿⣿⣿⣿⡿⠿⠿⠿⠿⠟⠋⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣷⡄⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⠟⠋⠀⠈⠙⠻⣦⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀⠈⣷⣿⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣾⣿⣿⣿⣿⣿⣿⠿⠿⣆⡀⠀⠀⠀⠀⠀⠀⠀⢿⢹⡇⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⠙⠲⢄⠀⠉⣳⠦⢤⡠⣤⠀⠀⠈⠀⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡝⣹⣿⣿⣿⣿⣿⣿⡆⠀⢬⡛⡇⠇⠀⠸⠆⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠟⣿⣿⣿⣿⡟⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢿⣿⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`,
  },
];

export function getProfileBySlug(slug: string): Profile | undefined {
  return PROFILES.find((p) => p.slug === slug);
}

export function getProfileSlugs(): string[] {
  return PROFILES.map((p) => p.slug);
}

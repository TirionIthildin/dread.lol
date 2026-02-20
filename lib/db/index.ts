import { MongoClient } from "mongodb";

const url = process.env.DATABASE_URL ?? "mongodb://dread:dread@localhost:27017/dread?authSource=admin";

let cachedClient: MongoClient | null = null;

export async function getDb() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(url);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function getDbName(): Promise<string> {
  const match = url.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : "dread";
}

export const COLLECTIONS = {
  users: "users",
  profiles: "profiles",
  profileViews: "profile_views",
  vouches: "vouches",
  galleryItems: "gallery_items",
  profileShortLinks: "profile_short_links",
  badges: "badges",
  userBadges: "user_badges",
  userGuilds: "user_guilds",
  profileReports: "profile_reports",
  pastes: "pastes",
  profileTemplates: "profile_templates",
  templateFavorites: "template_favorites",
  templateReports: "template_reports",
} as const;

export type Collections = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export * from "./schema";

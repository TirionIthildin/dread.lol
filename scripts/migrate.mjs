#!/usr/bin/env node
/**
 * MongoDB: Creates indexes. Used in production before starting the app.
 * Reads DATABASE_URL from environment (mongodb://...).
 * Usage: node scripts/migrate.mjs
 */
import { MongoClient } from "mongodb";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Migrations cannot run.");
  process.exit(1);
}

const match = url.match(/\/([^/?]+)(\?|$)/);
const dbName = match ? match[1] : "dread";

const maxAttempts = 10;
const delayMs = 2000;
let attempt = 0;
let client;

while (attempt < maxAttempts) {
  try {
    client = new MongoClient(url);
    await client.connect();
    await client.db(dbName).command({ ping: 1 });
    break;
  } catch (err) {
    attempt++;
    if (attempt >= maxAttempts) {
      console.error("Could not connect to MongoDB after", maxAttempts, "attempts:", err.message);
      process.exit(1);
    }
    console.log(`MongoDB not ready, retry ${attempt}/${maxAttempts} in ${delayMs}ms...`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

const db = client.db(dbName);

try {
  // _id index is created automatically by MongoDB for every collection
  await db.collection("users").createIndex({ discordUserId: 1 }, { unique: true });
  await db.collection("users").createIndex({ approved: 1, createdAt: -1 });

  await db.collection("profiles").createIndex({ slug: 1 }, { unique: true });
  await db.collection("profiles").createIndex({ userId: 1 }, { unique: true });

  await db.collection("profile_views").createIndex({ profileId: 1, viewedAt: -1 });

  await db.collection("vouches").createIndex({ profileId: 1, userId: 1 }, { unique: true });
  await db.collection("profile_reactions").createIndex({ profileId: 1, userId: 1 }, { unique: true });
  await db.collection("vouches").createIndex({ profileId: 1, createdAt: -1 });

  await db.collection("gallery_items").createIndex({ profileId: 1, sortOrder: 1 });

  await db.collection("profile_short_links").createIndex({ profileId: 1, slug: 1 }, { unique: true });

  await db.collection("badges").createIndex({ key: 1 }, { unique: true });
  await db.collection("badges").createIndex({ sortOrder: 1 });

  await db.collection("user_badges").createIndex({ userId: 1, badgeId: 1 }, { unique: true });
  await db.collection("user_guilds").createIndex({ userId: 1 }, { unique: true });

  await db.collection("profile_reports").createIndex({ profileId: 1, reportedBy: 1 }, { unique: true });
  await db.collection("profile_reports").createIndex({ profileId: 1, createdAt: -1 });

  console.log("MongoDB indexes created.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.close();
}

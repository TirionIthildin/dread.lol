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
  await db.collection("vouches").createIndex({ profileId: 1, createdAt: -1 });

  await db.collection("gallery_items").createIndex({ profileId: 1, sortOrder: 1 });

  await db.collection("profile_short_links").createIndex({ profileId: 1, slug: 1 }, { unique: true });

  await db.collection("badges").createIndex({ key: 1 }, { unique: true });
  await db.collection("badges").createIndex({ sortOrder: 1 });

  await db.collection("user_badges").createIndex({ userId: 1, badgeId: 1 }, { unique: true });
  await db.collection("user_guilds").createIndex({ userId: 1 }, { unique: true });
  await db.collection("user_roblox").createIndex({ userId: 1 }, { unique: true });

  await db.collection("profile_reports").createIndex({ profileId: 1, reportedBy: 1 }, { unique: true });
  await db.collection("profile_reports").createIndex({ profileId: 1, createdAt: -1 });

  await db.collection("pastes").createIndex({ slug: 1 }, { unique: true });
  await db.collection("pastes").createIndex({ createdAt: -1 });

  await db.collection("profile_templates").createIndex({ creatorId: 1, updatedAt: -1 });
  await db.collection("profile_templates").createIndex({ status: 1, applyCount: -1 });
  await db.collection("profile_templates").createIndex({ status: 1, createdAt: -1 });

  await db.collection("template_favorites").createIndex({ userId: 1, templateId: 1 }, { unique: true });
  await db.collection("template_favorites").createIndex({ templateId: 1 });

  await db.collection("template_reports").createIndex({ templateId: 1, reportedBy: 1 }, { unique: true });
  await db.collection("template_reports").createIndex({ templateId: 1, createdAt: -1 });

  await db.collection("profile_versions").createIndex({ userId: 1, createdAt: -1 });

  await db.collection("blog_posts").createIndex({ profileId: 1, createdAt: -1 });

  await db.collection("polar_checkouts").createIndex({ checkoutId: 1 }, { unique: true });

  await db.collection("polar_subscriptions").createIndex({ polarSubscriptionId: 1 }, { unique: true });
  await db.collection("polar_subscriptions").createIndex({ userId: 1, status: 1 });

  await db.collection("polar_orders").createIndex({ polarOrderId: 1 }, { unique: true });
  await db.collection("polar_orders").createIndex({ userId: 1, status: 1 });

  await db.collection("settings").createIndex({ key: 1 }, { unique: true });

  await db.collection("user_created_badges").createIndex(
    { userId: 1, creatorProgram: 1 },
    { sparse: true }
  );

  await db.collection("badge_redemption_links").createIndex({ token: 1 }, { unique: true });

  await db.collection("badge_redemption_events").createIndex({ linkId: 1, redeemedBy: 1 }, { unique: true });
  await db.collection("badge_redemption_events").createIndex({ token: 1, redeemedBy: 1 }, { unique: true });

  await db.collection("premium_voucher_links").createIndex({ token: 1 }, { unique: true });
  await db.collection("premium_voucher_links").createIndex({ createdBy: 1, createdAt: -1 });

  await db.collection("premium_voucher_redemptions").createIndex({ linkId: 1, redeemedBy: 1 }, { unique: true });
  await db.collection("premium_voucher_redemptions").createIndex({ creatorId: 1, redeemedAt: -1 });

  console.log("MongoDB indexes created.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.close();
}

#!/usr/bin/env node
/**
 * One-time MongoDB migration: rewrite stored `iconName` values from historical Phosphor
 * PascalCase names to Lucide export names.
 *
 * Collections:
 * - `badges` (field `iconName`)
 * - `user_created_badges` (field `iconName`)
 * - `profiles` (field `links` — JSON array of rows; each may include `iconName`)
 *
 * Reads DATABASE_URL (same as scripts/migrate.mjs). Idempotent: already-Lucide names are left unchanged.
 *
 * Usage: node scripts/migrate-icon-names-to-lucide.mjs
 * Run once against staging, then production. Not invoked by deploy / migrate.mjs.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadLucideSet() {
  const src = readFileSync(join(root, "lib/lucide-icon-names.ts"), "utf8");
  const m = src.match(/export const LUCIDE_ICON_NAMES = \[([\s\S]*?)\]\s+as const/);
  if (!m) throw new Error("Could not parse LUCIDE_ICON_NAMES from lib/lucide-icon-names.ts");
  return new Set([...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
}

function loadPhosphorMap() {
  const src = readFileSync(join(root, "lib/legacy-phosphor-to-lucide-map.generated.ts"), "utf8");
  const map = Object.create(null);
  for (const x of src.matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
    map[x[1]] = x[2];
  }
  return map;
}

const FALLBACK = "CircleHelp";

/**
 * @param {string} raw
 * @param {Set<string>} lucideSet
 * @param {Record<string, string>} phosphorMap
 */
function toLucide(raw, lucideSet, phosphorMap) {
  const s = raw.trim();
  if (!s) return null;
  if (s === "Award") return "Medal";
  if (lucideSet.has(s)) return s;
  const mapped = phosphorMap[s];
  if (mapped && lucideSet.has(mapped)) return mapped;
  return FALLBACK;
}

/**
 * @param {unknown} raw
 * @param {Set<string>} lucideSet
 * @param {Record<string, string>} phosphorMap
 */
function migrateIconString(raw, lucideSet, phosphorMap) {
  if (typeof raw !== "string") return { changed: false, value: raw };
  const next = toLucide(raw, lucideSet, phosphorMap);
  if (next === null) return { changed: false, value: raw };
  if (next === raw.trim()) return { changed: false, value: raw };
  return { changed: true, value: next };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const lucideSet = loadLucideSet();
  const phosphorMap = loadPhosphorMap();

  const match = url.match(/\/([^/?]+)(\?|$)/);
  const dbName = match ? match[1] : "dread";

  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(dbName);

  let badgesUpdated = 0;
  const badgeCursor = db.collection("badges").find({
    iconName: { $exists: true, $nin: [null, ""] },
  });
  for await (const doc of badgeCursor) {
    const { changed, value } = migrateIconString(doc.iconName, lucideSet, phosphorMap);
    if (changed) {
      await db.collection("badges").updateOne({ _id: doc._id }, { $set: { iconName: value } });
      badgesUpdated++;
    }
  }

  let ucbUpdated = 0;
  const ucbCursor = db.collection("user_created_badges").find({
    iconName: { $exists: true, $nin: [null, ""] },
  });
  for await (const doc of ucbCursor) {
    const { changed, value } = migrateIconString(doc.iconName, lucideSet, phosphorMap);
    if (changed) {
      await db.collection("user_created_badges").updateOne({ _id: doc._id }, { $set: { iconName: value } });
      ucbUpdated++;
    }
  }

  let profilesUpdated = 0;
  const profilesCursor = db.collection("profiles").find({
    links: { $exists: true, $nin: [null, ""] },
  });
  for await (const doc of profilesCursor) {
    const raw = doc.links;
    if (typeof raw !== "string") continue;
    let arr;
    try {
      arr = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!Array.isArray(arr)) continue;
    let any = false;
    const next = arr.map((row) => {
      if (!row || typeof row !== "object") return row;
      const iconRaw = row.iconName;
      if (typeof iconRaw !== "string" || !iconRaw.trim()) return row;
      const { changed, value } = migrateIconString(iconRaw, lucideSet, phosphorMap);
      if (changed) {
        any = true;
        return { ...row, iconName: value };
      }
      return row;
    });
    if (any) {
      await db.collection("profiles").updateOne({ _id: doc._id }, { $set: { links: JSON.stringify(next) } });
      profilesUpdated++;
    }
  }

  console.log(`badges: ${badgesUpdated} document(s) updated`);
  console.log(`user_created_badges: ${ucbUpdated} document(s) updated`);
  console.log(`profiles (links JSON): ${profilesUpdated} document(s) updated`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

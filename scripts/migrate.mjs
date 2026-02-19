#!/usr/bin/env node
/**
 * Applies Drizzle migrations in order. Used in production before starting the app.
 * Reads DATABASE_URL from environment. Tracks applied migrations in __drizzle_migrations.
 * Usage: node scripts/migrate.mjs
 */
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
const drizzleDir = join(root, "drizzle");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Migrations cannot run.");
  process.exit(1);
}

if (!existsSync(drizzleDir)) {
  console.error("drizzle folder not found. Cannot run migrations.");
  process.exit(1);
}

// Get migration files: NNNN_name.sql, excluding apply-missing.sql
const files = readdirSync(drizzleDir)
  .filter((f) => f.endsWith(".sql") && f !== "apply-missing.sql" && /^\d{4}_/.test(f))
  .sort();

if (files.length === 0) {
  console.error("No migration files found in drizzle/.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

// Retry connection (Postgres may still be starting)
const maxAttempts = 10;
const delayMs = 2000;
let attempt = 0;
while (attempt < maxAttempts) {
  try {
    await sql`SELECT 1`;
    break;
  } catch (err) {
    attempt++;
    if (attempt >= maxAttempts) {
      console.error("Could not connect to database after", maxAttempts, "attempts:", err.message);
      await sql.end();
      process.exit(1);
    }
    console.log(`Database not ready, retry ${attempt}/${maxAttempts} in ${delayMs}ms...`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

try {
  // Create migrations table (drizzle-kit format)
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint NOT NULL
    );
  `);

  const applied = await sql`SELECT hash FROM "__drizzle_migrations"`;
  const appliedSet = new Set(applied.map((r) => r.hash));

  for (const file of files) {
    const hash = file;
    if (appliedSet.has(hash)) {
      console.log(`Skip (already applied): ${file}`);
      continue;
    }

    const path = join(drizzleDir, file);
    const content = readFileSync(path, "utf8");

    console.log(`Applying: ${file}`);
    await sql.unsafe(content);
    await sql`INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (${hash}, ${Date.now()})`;
    appliedSet.add(hash);
  }

  console.log("Migrations complete.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}

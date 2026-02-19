#!/usr/bin/env node
/**
 * Applies drizzle/apply-missing.sql using DATABASE_URL.
 * Usage: node scripts/apply-missing-migration.mjs
 *        or: npm run db:apply-missing
 * Loads .env from cwd if present (so DATABASE_URL is set).
 */
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load .env if present
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1).replace(/\\n/g, "\n");
      }
      process.env[key] = value;
    }
  }
}

const connectionString = process.env.DATABASE_URL || "postgresql://dread:dread@localhost:5432/dread";
const sqlPath = join(root, "drizzle", "apply-missing.sql");

if (!existsSync(sqlPath)) {
  console.error("Not found:", sqlPath);
  process.exit(1);
}

const sqlContent = readFileSync(sqlPath, "utf8");

const sql = postgres(connectionString, { max: 1 });
try {
  await sql.unsafe(sqlContent);
  console.log("Applied drizzle/apply-missing.sql successfully.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}

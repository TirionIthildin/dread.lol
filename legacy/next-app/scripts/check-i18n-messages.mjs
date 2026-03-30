#!/usr/bin/env node
/**
 * Ensures every key in messages/en.json exists in messages/es.json (and vice versa).
 * Run via: npm run check:i18n
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function flattenKeys(obj, prefix = "") {
  /** @type {string[]} */
  const keys = [];
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return keys;
  }
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

const enPath = path.join(root, "messages", "en.json");
const esPath = path.join(root, "messages", "es.json");

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const es = JSON.parse(fs.readFileSync(esPath, "utf8"));

const enKeys = new Set(flattenKeys(en));
const esKeys = new Set(flattenKeys(es));

const missingInEs = [...enKeys].filter((k) => !esKeys.has(k)).sort();
const extraInEs = [...esKeys].filter((k) => !enKeys.has(k)).sort();

if (missingInEs.length > 0 || extraInEs.length > 0) {
  if (missingInEs.length > 0) {
    console.error("Keys in en.json missing from es.json:\n", missingInEs.join("\n"));
  }
  if (extraInEs.length > 0) {
    console.error("Keys in es.json not in en.json:\n", extraInEs.join("\n"));
  }
  process.exit(1);
}

console.log("i18n: en.json and es.json keys match.");

import fs from "fs";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "content", "site-docs");

/**
 * Load markdown body for a docs page slug. Returns null if the file is missing.
 */
export function loadSiteDoc(slug: string): string | null {
  const safe = slug.replace(/[^a-z0-9-]/gi, "");
  if (safe !== slug || !safe) return null;
  const file = path.join(DOCS_DIR, `${safe}.md`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

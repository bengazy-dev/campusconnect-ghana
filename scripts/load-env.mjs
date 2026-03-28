import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Minimal .env parser (no dependency). Values can be unquoted or "quoted".
 */
export function loadDotEnv() {
  const p = resolve(root, ".env");
  if (!existsSync(p)) return {};
  const text = readFileSync(p, "utf8");
  const out = {};
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function getInsforgeFromEnv() {
  const file = loadDotEnv();
  return {
    baseUrl: (process.env.INSFORGE_BASE_URL || file.INSFORGE_BASE_URL || "").replace(/\/$/, ""),
    anonKey: process.env.INSFORGE_ANON_KEY || file.INSFORGE_ANON_KEY || "",
  };
}

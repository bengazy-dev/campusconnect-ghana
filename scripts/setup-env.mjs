import { copyFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error("Missing .env.example — cannot create .env.");
    process.exit(1);
  }
  copyFileSync(examplePath, envPath);
  console.log("Created .env from .env.example");
  console.log("");
  console.log("Next: open .env and set your real values from the InsForge dashboard:");
  console.log("  INSFORGE_BASE_URL=https://<appkey>.<region>.insforge.app");
  console.log("  INSFORGE_ANON_KEY=<your anon / public key>");
  console.log("");
  console.log("Then run:  npm run env:generate");
} else {
  console.log(".env already exists — not overwriting.");
}

const gen = spawnSync(process.execPath, [resolve(root, "scripts/generate-insforge-env.mjs")], {
  cwd: root,
  stdio: "inherit",
});
process.exit(gen.status ?? 1);

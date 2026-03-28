/**
 * Browser entry for InsForge helpers. Loads a local bundle (no CDN) so auth works offline
 * and when esm.sh is blocked. Edit js/insforge-config-source.js then run: npm run build:config
 */
export * from "./vendor/insforge-config.bundle.js";

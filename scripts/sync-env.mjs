import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const consoledot = resolve(root, "..");

function parseEnvFile(filePath) {
  let text;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    return {};
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function pick(env, ...keys) {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return "";
}

/** Prefer Supabase transaction pooler (6543) for pg — session mode (5432) caps at ~15 clients. */
function normalizePgPoolUrl(url) {
  if (!url) return "";
  let normalized = url;
  if (url.includes("pooler.supabase.com")) {
    normalized = url
      .replace(":5432/", ":6543/")
      .replace(":5432?", ":6543?");
  }
  if (!normalized.includes("sslmode=")) {
    normalized += normalized.includes("?") ? "&sslmode=no-verify" : "?sslmode=no-verify";
  }
  return normalized;
}

const timeZone = {
  ...parseEnvFile(resolve(consoledot, "time-zone", ".env.local")),
  ...parseEnvFile(resolve(consoledot, "time-zone", ".env")),
};
const takeBring = {
  ...parseEnvFile(resolve(consoledot, "Take-Bring", ".env")),
  ...parseEnvFile(resolve(consoledot, "Take-Bring", ".env.local")),
  ...parseEnvFile(resolve(consoledot, "Take-Bring", ".env.vercel.production")),
  ...parseEnvFile(resolve(consoledot, "Take-Bring", ".env.production")),
};
const reifenservice = parseEnvFile(resolve(consoledot, "tz-refienservice", ".env"));

const takeBringDb = normalizePgPoolUrl(
  pick(takeBring, "DATABASE_URL", "DIRECT_URL"),
);
const reifenserviceDb = normalizePgPoolUrl(
  pick(reifenservice, "DATABASE_URL", "DIRECT_URL"),
);
const tzTransportDb = normalizePgPoolUrl(
  pick(timeZone, "DATABASE_URL", "DIRECT_URL"),
);

const lines = [
  "# Synced from sibling projects (npm run sync:env)",
  `TZ_TRANSPORT_DATABASE_URL=${tzTransportDb}`,
  `TAKE_BRING_DATABASE_URL=${takeBringDb}`,
  `TAKE_BRING_SUPABASE_URL=${pick(takeBring, "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL")}`,
  `TAKE_BRING_SUPABASE_SERVICE_ROLE_KEY=${pick(takeBring, "SUPABASE_SERVICE_ROLE_KEY")}`,
  `TAKE_BRING_SITE_URL=${pick(takeBring, "NEXT_PUBLIC_SITE_URL") || "https://take-bring.vercel.app"}`,
  `TZ_REIFENSERVICE_DATABASE_URL=${reifenserviceDb}`,  `TZ_REIFENSERVICE_SUPABASE_URL=${pick(reifenservice, "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL")}`,
  `TZ_REIFENSERVICE_SUPABASE_SERVICE_ROLE_KEY=${pick(reifenservice, "SUPABASE_SERVICE_ROLE_KEY")}`,
  `AUTH_JWT_SECRET=${pick(timeZone, "AUTH_JWT_SECRET", "JWT_SECRET") || "tz-hub-dev-jwt-secret"}`,
  `AUTH_REFRESH_SECRET=${pick(timeZone, "AUTH_REFRESH_SECRET") || "tz-hub-dev-refresh-secret"}`,
];

writeFileSync(resolve(root, ".env.local"), lines.join("\n") + "\n", "utf8");

console.log("Wrote .env.local");
console.log({
  tzTransport: Boolean(tzTransportDb),
  takeBringDb: Boolean(takeBringDb),
  takeBringSupabase: Boolean(pick(takeBring, "NEXT_PUBLIC_SUPABASE_URL")),
  reifenservice: Boolean(reifenserviceDb),
});

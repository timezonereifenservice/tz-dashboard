import pg from "pg";
import { readFileSync } from "fs";

function loadEnv() {
  let text = readFileSync(".env.local", "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnv();

const pool = new pg.Pool({
  connectionString: process.env.TZ_TRANSPORT_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await pool.query(`
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nav_permissions_json JSONB NOT NULL DEFAULT '{}'::jsonb
`);

console.log("Added nav_permissions_json column to users (if missing).");
await pool.end();

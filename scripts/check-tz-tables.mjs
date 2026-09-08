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

const tzUrl = process.env.TZ_TRANSPORT_DATABASE_URL;
const pool = new pg.Pool({
  connectionString: tzUrl,
  ssl: { rejectUnauthorized: false },
});

const tables = ["leads", "blogs", "analytics_events", "users"];
for (const table of tables) {
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS c FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
      [table],
    );
    console.log(`tz-transport has ${table}:`, r.rows[0].c > 0 ? "yes" : "no");
  } catch (e) {
    console.log(`err ${table}`, e.message);
  }
}
await pool.end();

import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const consoledot = resolve(root, "..");

function loadEnvFile(path) {
  let text = readFileSync(path, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const candidates = [
  ["Take-Bring/.env", loadEnvFile(resolve(consoledot, "Take-Bring", ".env"))],
  ["time-zone/.env", loadEnvFile(resolve(consoledot, "time-zone", ".env"))],
  ["tz-refienservice/.env", loadEnvFile(resolve(consoledot, "tz-refienservice", ".env"))],
  ["Book-Karo/backend/.env", loadEnvFile(resolve(consoledot, "Book-Karo", "backend", ".env"))],
  ["Nasaq/backend/.env", loadEnvFile(resolve(consoledot, "Nasaq", "backend", ".env"))],
];

async function probe(name, url) {
  if (!url) return;
  const pool = new pg.Pool({
    connectionString: url.includes("sslmode") ? url : url + "?sslmode=no-verify",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    const blogs = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='blogs' AND column_name IN ('body_html','date_label','views_count')`,
    );
    const leads = await pool.query(`SELECT COUNT(*)::int AS c FROM leads`).catch(() => null);
    const tbCols = blogs.rows.map((r) => r.column_name);
    if (tbCols.length >= 2 || leads) {
      console.log(name, {
        takeBringBlogCols: tbCols,
        leads: leads?.rows[0]?.c ?? "no table",
        host: url.split("@")[1]?.split("/")[0],
      });
    }
  } catch (e) {
    console.log(name, "ERR", String(e.message).slice(0, 60));
  } finally {
    await pool.end();
  }
}

for (const [name, env] of candidates) {
  const url = env.DATABASE_URL || env.DIRECT_URL;
  await probe(name, url);
}

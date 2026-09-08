import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "../.env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const pool = new pg.Pool({
  connectionString: env.TAKE_BRING_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const leadCols = await pool.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name='leads' ORDER BY 1",
);
console.log("lead columns:", leadCols.rows.map((r) => r.column_name).join(", "));

const key = env.TAKE_BRING_SUPABASE_SERVICE_ROLE_KEY;
const base = env.TAKE_BRING_SUPABASE_URL;

async function supa(path) {
  const r = await fetch(`${base}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await r.text();
  return { ok: r.ok, status: r.status, body: text.slice(0, 300) };
}

const LEAD_SELECT =
  "id, created_at, updated_at, type, status, form_key, source_page, source_label, full_name, email, phone, whatsapp, inquiry_type, message";

console.log("leads supabase:", await supa(`leads?select=${encodeURIComponent(LEAD_SELECT)}&limit=1`));
console.log(
  "events supabase:",
  await supa(
    "analytics_events?select=id,created_at,event_type,path,cta_id,consent_value,session_id,visitor_id,country,device,browser,locale&limit=1",
  ),
);

function sinceIso(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

for (const days of [7, 14, 30, 60]) {
  const since = sinceIso(days);
  const r = await pool.query(
    "SELECT COUNT(*)::int AS n FROM analytics_events WHERE created_at >= $1",
    [since],
  );
  console.log(`events since ${days}d (${since.slice(0, 10)}):`, r.rows[0].n);
}

await pool.end();

import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

async function testPg(name, url) {
  if (!url) return { name, ok: false, error: "missing url" };
  const pool = new pg.Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    const r = await pool.query("SELECT 1 AS ok");
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1 LIMIT 20"
    );
    let counts = {};
    for (const t of ["leads", "blogs", "analytics_events"]) {
      try {
        const c = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
        counts[t] = c.rows[0].n;
      } catch {
        counts[t] = null;
      }
    }
    return { name, ok: true, tables: tables.rows.map((x) => x.table_name), counts };
  } catch (e) {
    return { name, ok: false, error: e.message };
  } finally {
    await pool.end().catch(() => {});
  }
}

async function testSupabase(name, baseUrl, key) {
  if (!baseUrl || !key) return { name, ok: false, error: "missing url/key" };
  try {
    const r = await fetch(`${baseUrl}/rest/v1/leads?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    const text = await r.text();
    return { name, ok: r.ok, status: r.status, body: text.slice(0, 200) };
  } catch (e) {
    return { name, ok: false, error: e.message };
  }
}

const results = {
  pg: await Promise.all([
    testPg("TZ Transport", env.TZ_TRANSPORT_DATABASE_URL),
    testPg("Take & Bring", env.TAKE_BRING_DATABASE_URL),
    testPg("Reifenservice", env.TZ_REIFENSERVICE_DATABASE_URL),
  ]),
  supabase: await Promise.all([
    testSupabase(
      "Take & Bring",
      env.TAKE_BRING_SUPABASE_URL,
      env.TAKE_BRING_SUPABASE_SERVICE_ROLE_KEY
    ),
    testSupabase(
      "Reifenservice",
      env.TZ_REIFENSERVICE_SUPABASE_URL,
      env.TZ_REIFENSERVICE_SUPABASE_SERVICE_ROLE_KEY
    ),
  ]),
};

console.log(JSON.stringify(results, null, 2));

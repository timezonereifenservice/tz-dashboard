import { readFileSync } from "fs";
import pg from "pg";

function loadEnv() {
  let text = readFileSync(".env.local", "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

async function test(name, url, queries) {
  console.log(`\n=== ${name} ===`);
  if (!url) {
    console.log("MISSING URL");
    return;
  }
  const pool = new pg.Pool({ connectionString: url });
  try {
    for (const q of queries) {
      try {
        const r = await pool.query(q);
        console.log("OK:", q.slice(0, 70));
        if (q.includes("information_schema")) {
          console.log("   cols:", r.rows.map((x) => x.column_name).join(", "));
        } else {
          console.log("   sample:", r.rows[0]);
        }
      } catch (e) {
        console.log("ERR:", q.slice(0, 70));
        console.log("   ", e.message);
      }
    }
  } finally {
    await pool.end();
  }
}

loadEnv();
const tz = process.env.TZ_TRANSPORT_DATABASE_URL;
const tb = process.env.TAKE_BRING_DATABASE_URL;
console.log("URLs set:", { tz: !!tz, tb: !!tb, same: tz === tb });

await test("tz-transport", tz, [
  "SELECT COUNT(*)::int AS count FROM leads",
  "SELECT COUNT(*)::int AS count FROM analytics_events",
  `SELECT id, source, status, "fullName", "serviceName", "formType" FROM leads LIMIT 1`,
  "SELECT column_name FROM information_schema.columns WHERE table_name='leads' ORDER BY 1",
]);

await test("take-bring", tb, [
  "SELECT COUNT(*)::int AS count FROM leads",
  "SELECT COUNT(*)::int AS count FROM analytics_events",
  "SELECT id, type, status, full_name, form_key FROM leads LIMIT 1",
  "SELECT id, title, slug, status, views_count FROM blogs LIMIT 1",
  "SELECT column_name FROM information_schema.columns WHERE table_name='blogs' ORDER BY 1",
  "SELECT column_name FROM information_schema.columns WHERE table_name='leads' ORDER BY 1",
]);

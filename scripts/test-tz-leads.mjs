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

loadEnv();
const pool = new pg.Pool({ connectionString: process.env.TZ_TRANSPORT_DATABASE_URL });

const bad = `SELECT id, source, status, full_name, email, phone, message, service_name, form_key, page_path, page_name, form_name, created_at, updated_at FROM leads LIMIT 1`;
const good = `SELECT id, source, status, "fullName", email, phone, message, "serviceName", "formType", form_key, page_path, page_name, form_name, created_at, updated_at FROM leads LIMIT 1`;

for (const q of [bad, good]) {
  try {
    const r = await pool.query(q);
    console.log("OK:", Object.keys(r.rows[0] ?? {}));
  } catch (e) {
    console.log("ERR:", e.message);
  }
}
await pool.end();

import pg from "pg";

const pass = encodeURIComponent("ZOom@2020@#$");
const ref = "yglqhezbmfshasphimre";
const hosts = [
  `postgresql://postgres.${ref}:${pass}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`,
];

for (const url of hosts) {
  const label = url.split("@")[1].split("/")[0];
  const pool = new pg.Pool({
    connectionString: url + "?sslmode=no-verify",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    const r = await pool.query("SELECT 1 as ok");
    console.log("OK", label, r.rows[0]);
  } catch (e) {
    console.log("ERR", label, String(e.message).slice(0, 100));
  }
  await pool.end();
}

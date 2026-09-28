import { Pool, type QueryResultRow } from "pg";

const globalForOffers = globalThis as unknown as {
  offersPool: Pool | undefined;
};

function offersPoolMax(): number {
  const override = process.env.PG_POOL_MAX?.trim();
  if (override) {
    const parsed = Number.parseInt(override, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 1;
}

function getOffersConnectionString(): string {
  const url = process.env.TZ_REIFENSERVICE_OFFERS_DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "Missing TZ_REIFENSERVICE_OFFERS_DATABASE_URL in environment.",
    );
  }
  return url;
}

function buildOffersPool(): Pool {
  const connectionString = getOffersConnectionString();
  const useSsl =
    connectionString.includes("supabase") ||
    connectionString.includes("sslmode=require") ||
    connectionString.includes("sslmode=no-verify");

  return new Pool({
    connectionString,
    max: offersPoolMax(),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

export function getOffersPool(): Pool {
  if (!globalForOffers.offersPool) {
    globalForOffers.offersPool = buildOffersPool();
  }
  return globalForOffers.offersPool;
}

export async function offersQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  const pool = getOffersPool();
  return pool.query<T>(text, values);
}

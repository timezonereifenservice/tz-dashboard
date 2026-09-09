import { Pool, type PoolConfig, type QueryResultRow } from "pg";
import type { ProjectId } from "@/lib/projects/config";

const globalForPools = globalThis as unknown as {
  projectPools: Map<string, Pool> | undefined;
};

function getPoolsMap() {
  if (!globalForPools.projectPools) {
    globalForPools.projectPools = new Map();
  }
  return globalForPools.projectPools;
}

function isSupabaseSessionPooler(connectionString: string): boolean {
  if (connectionString.includes(":6543")) return false;
  return (
    connectionString.includes("pooler.supabase.com") ||
    (connectionString.includes(".supabase.co") &&
      (connectionString.includes(":5432/") || connectionString.includes(":5432?")))
  );
}

function isSupabasePooler(connectionString: string): boolean {
  return (
    connectionString.includes("pooler.supabase.com") ||
    connectionString.includes(":6543/") ||
    connectionString.includes(":6543?")
  );
}

function getPoolMax(connectionString: string): number {
  const override = process.env.PG_POOL_MAX?.trim();
  if (override) {
    const parsed = Number.parseInt(override, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  // Session-mode Supabase pooler (port 5432) shares a hard cap (~15) across all clients.
  if (isSupabaseSessionPooler(connectionString)) return 1;
  // Transaction pooler or direct Supabase host — still keep small for serverless.
  if (isSupabasePooler(connectionString) || connectionString.includes(".supabase.co")) {
    return 2;
  }
  return 4;
}

function buildPoolConfig(connectionString: string): PoolConfig {
  const useSsl =
    connectionString.includes("supabase") ||
    connectionString.includes("sslmode=require") ||
    connectionString.includes("sslmode=no-verify");

  return {
    connectionString,
    max: getPoolMax(connectionString),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

function envKeyForProject(projectId: ProjectId): string {
  switch (projectId) {
    case "take-bring":
      return "TAKE_BRING_DATABASE_URL";
    case "tz-transport":
      return "TZ_TRANSPORT_DATABASE_URL";
    case "tz-reifenservice":
      return "TZ_REIFENSERVICE_DATABASE_URL";
  }
}

function getConnectionString(projectId: ProjectId): string | undefined {
  const primary = process.env[envKeyForProject(projectId)];
  if (primary) return primary;

  if (projectId === "tz-transport") {
    return process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  }

  return undefined;
}

export function getProjectPool(projectId: ProjectId): Pool {
  const connectionString = getConnectionString(projectId);
  if (!connectionString) {
    throw new Error(`Missing ${envKeyForProject(projectId)} in environment.`);
  }

  const pools = getPoolsMap();
  const existing = pools.get(connectionString);
  if (existing) return existing;

  const pool = new Pool(buildPoolConfig(connectionString));
  pools.set(connectionString, pool);
  return pool;
}

export function getAuthPool(): Pool {
  return getProjectPool("tz-transport");
}

export async function projectQuery<T extends QueryResultRow = QueryResultRow>(
  projectId: ProjectId,
  text: string,
  values: unknown[] = [],
) {
  const pool = getProjectPool(projectId);
  return pool.query<T>(text, values);
}

export async function authQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  const pool = getAuthPool();
  return pool.query<T>(text, values);
}

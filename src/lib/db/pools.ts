import { Pool, type QueryResultRow } from "pg";
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
  const pools = getPoolsMap();
  const existing = pools.get(projectId);
  if (existing) return existing;

  const connectionString = getConnectionString(projectId);
  if (!connectionString) {
    throw new Error(`Missing ${envKeyForProject(projectId)} in environment.`);
  }

  const pool = new Pool({
    connectionString,
    max: 8,
    ssl: { rejectUnauthorized: false },
  });
  pools.set(projectId, pool);
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

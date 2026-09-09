import type { Pool, QueryResult, QueryResultRow } from "pg";
import type { ProjectId } from "@/lib/projects/config";
import { getProjectPool } from "@/lib/db/pools";

type QueryFn = (
  text: string,
  values?: unknown[],
) => Promise<QueryResult<QueryResultRow>>;

export async function withProjectTransaction<T>(
  projectId: ProjectId,
  fn: (query: QueryFn) => Promise<T>,
): Promise<T> {
  const pool = getProjectPool(projectId);
  const client = await pool.connect();

  const query: QueryFn = (text, values = []) => client.query(text, values);

  try {
    await client.query("BEGIN");
    const result = await fn(query);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function withPoolTransaction<T>(
  pool: Pool,
  fn: (query: QueryFn) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  const query: QueryFn = (text, values = []) => client.query(text, values);

  try {
    await client.query("BEGIN");
    const result = await fn(query);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

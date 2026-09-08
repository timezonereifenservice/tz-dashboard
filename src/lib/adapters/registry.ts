import { takeBringAdapter } from "@/lib/adapters/take-bring";
import { tzReifenserviceAdapter } from "@/lib/adapters/tz-reifenservice";
import { tzTransportAdapter } from "@/lib/adapters/tz-transport";
import type { ProjectAdapter } from "@/lib/adapters/types";
import type { ProjectId } from "@/lib/projects/config";

const ADAPTERS: Record<ProjectId, ProjectAdapter> = {
  "take-bring": takeBringAdapter,
  "tz-transport": tzTransportAdapter,
  "tz-reifenservice": tzReifenserviceAdapter,
};

export function getAdapter(projectId: ProjectId): ProjectAdapter {
  const adapter = ADAPTERS[projectId];
  if (!adapter) throw new Error(`Unknown project: ${projectId}`);
  return adapter;
}

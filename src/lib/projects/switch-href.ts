import type { ProjectId } from "@/lib/projects/config";

/** Always land on overview when switching projects — section paths differ per project. */
export function getProjectSwitchHref(nextProjectId: ProjectId) {
  return `/${nextProjectId}/overview`;
}

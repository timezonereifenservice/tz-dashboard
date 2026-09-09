import type { ProjectId } from "@/lib/projects/config";

export type ProjectMeta = {
  domain: string;
  url: string;
  category: string;
};

export const PROJECT_META: Record<ProjectId, ProjectMeta> = {
  "tz-transport": {
    domain: "tz-transport.de",
    url: "https://www.tz-transport.de",
    category: "Spedition & Logistics",
  },
  "take-bring": {
    domain: "take-bring.eu",
    url: "https://take-bring.vercel.app",
    category: "Express Courier & Logistics",
  },
  "tz-reifenservice": {
    domain: "timezone-reifenservice.de",
    url: "https://timezone-reifenservice.de",
    category: "Auto Workshop & Reifenservice",
  },
};

export function getProjectMeta(projectId: ProjectId): ProjectMeta {
  return PROJECT_META[projectId];
}

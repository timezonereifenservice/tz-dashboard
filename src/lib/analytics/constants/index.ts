import type { ProjectId } from "@/lib/projects/config";
import { takeBringAnalyticsConstants } from "./take-bring";
import { tzReifenserviceAnalyticsConstants } from "./tz-reifenservice";
import { tzTransportAnalyticsConstants } from "./tz-transport";
import type { ProjectAnalyticsConstants, ServiceAnalyticsDef } from "./types";

const CONSTANTS: Record<ProjectId, ProjectAnalyticsConstants> = {
  "tz-transport": tzTransportAnalyticsConstants,
  "take-bring": takeBringAnalyticsConstants,
  "tz-reifenservice": tzReifenserviceAnalyticsConstants,
};

const PATH_ALIASES: Record<string, string> = {
  "/kfz-service": "/kfz-services",
};

export function normalizeAnalyticsPath(path: string): string {
  let normalized = path.split("?")[0]?.split("#")[0]?.trim() || "/";
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  normalized = normalized.replace(/^\/(en|de|ro)(?=\/|$)/, "") || "/";
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return PATH_ALIASES[normalized] ?? normalized;
}

export function getAnalyticsConstants(
  projectId: ProjectId,
): ProjectAnalyticsConstants {
  return CONSTANTS[projectId];
}

export function pathMatchesService(
  path: string,
  service: ServiceAnalyticsDef,
): boolean {
  const normalized = normalizeAnalyticsPath(path);
  if (service.paths?.includes(normalized)) return true;
  for (const prefix of service.pathPrefixes ?? []) {
    if (normalized.startsWith(prefix)) return true;
  }
  return false;
}

export function serviceIdForPath(
  path: string,
  services: ServiceAnalyticsDef[],
): string | null {
  const normalized = normalizeAnalyticsPath(path);
  for (const service of services) {
    if (service.paths?.includes(normalized)) return service.id;
    for (const prefix of service.pathPrefixes ?? []) {
      if (normalized.startsWith(prefix)) return service.id;
    }
  }
  return null;
}

export function servicePathLabel(service: ServiceAnalyticsDef): string {
  if (service.paths?.length) return service.paths.join(" · ");
  return (service.pathPrefixes ?? []).join(" · ");
}

export type { ProjectAnalyticsConstants, ServiceAnalyticsDef };

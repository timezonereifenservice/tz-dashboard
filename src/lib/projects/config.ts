export type ProjectFeature =
  | "overview"
  | "analytics"
  | "leads"
  | "blogs"
  | "chatbot-leads";

export type ProjectId = "take-bring" | "tz-transport" | "tz-reifenservice";

export type ProjectConfig = {
  id: ProjectId;
  name: string;
  slug: ProjectId;
  description: string;
  databaseEnvKey: string;
  features: ProjectFeature[];
};

export const PROJECTS: ProjectConfig[] = [
  {
    id: "take-bring",
    name: "Take & Bring",
    slug: "take-bring",
    description: "take-bring.com logistics website",
    databaseEnvKey: "TAKE_BRING_DATABASE_URL",
    features: ["overview", "analytics", "leads", "blogs", "chatbot-leads"],
  },
  {
    id: "tz-transport",
    name: "TZ Transport",
    slug: "tz-transport",
    description: "tz-transport.de marketing site",
    databaseEnvKey: "TZ_TRANSPORT_DATABASE_URL",
    features: ["overview", "analytics", "leads", "blogs", "chatbot-leads"],
  },
  {
    id: "tz-reifenservice",
    name: "TZ Reifenservice",
    slug: "tz-reifenservice",
    description: "timezone-reifenservice.de",
    databaseEnvKey: "TZ_REIFENSERVICE_DATABASE_URL",
    features: ["overview", "analytics", "leads"],
  },
];

export function getProjectBySlug(slug: string): ProjectConfig | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function projectHasFeature(
  project: ProjectConfig,
  feature: ProjectFeature,
): boolean {
  return project.features.includes(feature);
}

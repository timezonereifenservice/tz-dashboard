import { notFound, redirect } from "next/navigation";
import {
  getProjectBySlug,
  projectHasFeature,
  type ProjectConfig,
  type ProjectFeature,
} from "@/lib/projects/config";

/**
 * Resolve a project slug and ensure it supports `feature`.
 * Unknown project → 404. Known project without feature → overview (never a dead 404).
 */
export function requireProjectFeature(
  projectSlug: string,
  feature: ProjectFeature,
): ProjectConfig {
  const project = getProjectBySlug(projectSlug);
  if (!project) notFound();
  if (!projectHasFeature(project, feature)) {
    redirect(`/${project.slug}/overview`);
  }
  return project;
}

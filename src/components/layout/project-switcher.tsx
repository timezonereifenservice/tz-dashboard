"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getProjectMeta } from "@/lib/projects/meta";
import {
  getProjectBySlug,
  projectHasFeature,
  type ProjectConfig,
  type ProjectFeature,
  type ProjectId,
} from "@/lib/projects/config";
import styles from "./sidebar.module.css";

const SECTION_FEATURES: Record<string, ProjectFeature> = {
  overview: "overview",
  "website-analytics": "analytics",
  leads: "leads",
  "chatbot-leads": "chatbot-leads",
  blogs: "blogs",
};

function getSwitchTarget(pathname: string, nextProjectId: ProjectId) {
  const project = getProjectBySlug(nextProjectId);
  if (!project) return `/${nextProjectId}/overview`;

  if (pathname.startsWith("/settings")) {
    return `/${nextProjectId}/overview`;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return `/${nextProjectId}/overview`;
  }

  const section = segments[1] ?? "overview";
  const feature = SECTION_FEATURES[section];
  if (feature && !projectHasFeature(project, feature)) {
    return `/${nextProjectId}/overview`;
  }

  if (segments.length > 2) {
    return `/${nextProjectId}/${section}`;
  }

  if (segments.length >= 2) {
    return `/${nextProjectId}/${section}`;
  }

  return `/${nextProjectId}/overview`;
}

type ProjectSwitcherProps = {
  projects: ProjectConfig[];
  currentProject: ProjectConfig;
};

export function ProjectSwitcher({ projects, currentProject }: ProjectSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = getProjectMeta(currentProject.id);

  function onProjectChange(nextProjectId: string) {
    if (nextProjectId === currentProject.id) return;
    router.push(getSwitchTarget(pathname, nextProjectId as ProjectId));
  }

  return (
    <div className={styles.projectSwitcher}>
      <div className={styles.projectButton}>
        <span className={styles.projectInfo}>
          <span className={styles.projectDot} aria-hidden />
          <span>
            <span className={styles.projectName}>{currentProject.name}</span>
            <span className={styles.projectDomain}>{meta.domain}</span>
          </span>
        </span>
        <ChevronDown size={18} aria-hidden />
        <select
          className={styles.projectSelect}
          value={currentProject.id}
          aria-label="Switch project"
          onChange={(e) => onProjectChange(e.target.value)}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

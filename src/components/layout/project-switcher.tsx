"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
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

  if (pathname.startsWith("/settings") || pathname.startsWith("/users")) {
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function onProjectChange(nextProjectId: ProjectId) {
    if (nextProjectId === currentProject.id) {
      setOpen(false);
      return;
    }
    setOpen(false);
    router.push(getSwitchTarget(pathname, nextProjectId));
  }

  return (
    <div className={styles.projectSwitcher} ref={wrapRef}>
      <button
        type="button"
        className={styles.projectButton}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Switch project"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.projectInfo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentProject.iconSrc}
            alt=""
            className={styles.projectIcon}
          />
          <span className={styles.projectName}>{currentProject.name}</span>
        </span>
        <ChevronDown size={18} aria-hidden />
      </button>

      {open ? (
        <div className={styles.projectMenu} role="listbox">
          {projects.map((project) => {
            const isActive = project.id === currentProject.id;
            return (
              <button
                key={project.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={
                  isActive ? styles.projectMenuItemActive : styles.projectMenuItem
                }
                onClick={() => onProjectChange(project.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.iconSrc}
                  alt=""
                  className={styles.projectIcon}
                />
                <span>{project.name}</span>
                {isActive ? <Check size={16} aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

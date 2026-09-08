import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useProjectStore } from "../store/project.store";
import { projectService } from "../services/project.service";
import type { Project, ProjectStatus } from "../types/project.types";

interface ProjectContextValue {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  setActiveProjectId: (projectId: string | null) => void;
  getProjectById: (projectId: string) => Project | null;
  getProjectsByStatus: (status?: ProjectStatus) => Project[];
  stats: ReturnType<typeof projectService.getProjectStats>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: PropsWithChildren) {
  const [projects, setProjects] = useState(() => projectService.getProjects());
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId);
  useEffect(() => {
    void projectService.loadProjects().then((remoteProjects) => {
      if (remoteProjects) setProjects(remoteProjects);
    });
  }, []);

  const stats = projectService.getProjectStats(projects);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      activeProjectId,
      activeProject,
      setActiveProjectId,
      getProjectById: (projectId: string) => projects.find((project) => project.id === projectId || project.code === projectId) ?? null,
      getProjectsByStatus: (status?: ProjectStatus) => status ? projects.filter((project) => project.status === status) : projects,
      stats,
    }),
    [activeProject, activeProjectId, projects, setActiveProjectId, stats],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within ProjectProvider");
  }
  return context;
}

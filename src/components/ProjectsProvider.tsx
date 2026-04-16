"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Project } from "@/lib/constants";

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  refresh: () => Promise<void>;
  getProject: (key: string) => Project | undefined;
}

const ProjectsContext = createContext<ProjectsContextType>({
  projects: [],
  loading: true,
  refresh: async () => {},
  getProject: () => undefined,
});

export function useProjects() {
  return useContext(ProjectsContext);
}

export default function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/projects");
    setProjects(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getProject = useCallback(
    (key: string) => projects.find((p) => p.key === key),
    [projects]
  );

  return (
    <ProjectsContext.Provider value={{ projects, loading, refresh, getProject }}>
      {children}
    </ProjectsContext.Provider>
  );
}

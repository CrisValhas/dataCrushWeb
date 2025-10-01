import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ProjectContextType = {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectIdState] = useState<string | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem('aw_project_id');
    if (saved) setProjectIdState(saved);
    const onReset = () => setProjectIdState(null);
    window.addEventListener('aw:project:reset' as any, onReset);
    return () => window.removeEventListener('aw:project:reset' as any, onReset);
  }, []);
  const setProjectId = (id: string | null) => {
    setProjectIdState(id);
    if (id) localStorage.setItem('aw_project_id', id);
    else localStorage.removeItem('aw_project_id');
  };
  const value = useMemo(() => ({ projectId, setProjectId }), [projectId]);
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}

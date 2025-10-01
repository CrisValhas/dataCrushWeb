import React, { createContext, useContext, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '../lib/api';
import { useProject } from './project';
import { useAuth } from './auth';
import { FigmaFile, ProjectFigmaFile } from '../lib/types';

type Project = { _id: string; name: string; description?: string };
type Event = { _id: string; name: string; category: string; actionType: string; component: string };
type Funnel = { _id: string; name: string; steps: { eventId: string; alias?: string }[] };

type DataContextType = {
  projects: {
    items: Project[];
    loading: boolean;
    refetch: () => void;
    create: (name: string, description?: string) => Promise<Project>;
    update: (id: string, patch: Partial<Project>) => Promise<Project>;
    remove: (id: string) => Promise<void>;
  };
  events: {
    items: Event[];
    loading: boolean;
    refetch: () => void;
    create: (input: Omit<Event, '_id'> & { projectId: string }) => Promise<Event>;
    update: (id: string, patch: Partial<Event>) => Promise<Event>;
    remove: (id: string) => Promise<void>;
  };
  funnels: {
    items: Funnel[];
    loading: boolean;
    refetch: () => void;
    create: (name: string, steps: { eventId: string; alias?: string }[]) => Promise<Funnel>;
    update: (id: string, patch: Partial<Funnel>) => Promise<Funnel>;
    remove: (id: string) => Promise<void>;
  };
  frames: {
    items: any[];
    loading: boolean;
    refetch: () => void;
  };
  dashboard: {
    cards: any[];
    loading: boolean;
    refetch: () => void;
  };
  measurement: {
    get: (format: 'json' | 'js') => Promise<string>;
  };
  verification: {
    runId: string | null;
    results: any[];
    running: boolean;
    run: () => Promise<void>;
  };
  integrations: {
    gtmContainers: any[];
    loading: boolean;
    refetch: () => void;
    connectGtm: () => Promise<void>;
    connectGa4: () => Promise<void>;
    connectFigma: () => Promise<void>;
    figmaFiles: {
      items: FigmaFile[];
      loading: boolean;
      refetch: () => void;
    };
    projectFigmaFile: {
      data: ProjectFigmaFile | null;
      loading: boolean;
      refetch: () => void;
      assign: (fileKey: string, fileName: string, fileUrl?: string) => Promise<void>;
      remove: () => Promise<void>;
    };
  };
  eventCounts: Record<string, number>;
  connections: Record<string, string[]>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { projectId } = useProject();
  const { user } = useAuth();
  const userId = (user as any)?._id || null;

  // Projects
  const projectsQuery = useQuery({
    queryKey: ['projects', userId],
    enabled: Boolean(userId),
    queryFn: async () => (await apiFetch<Project[]>('/projects')).data,
  });
  const createProject = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) =>
      (await apiFetch<Project>('/projects', { method: 'POST', body: { teamId: 'team-1', name, description } })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
  const updateProject = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Project> }) =>
      (await apiFetch<Project>(`/projects/${id}`, { method: 'PUT', body: patch })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
  const removeProject = useMutation({
    mutationFn: async (id: string) => { await apiFetch(`/projects/${id}`, { method: 'DELETE' }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  // Events (scoped by project)
  const eventsQuery = useQuery({
    queryKey: ['events', userId, projectId],
    enabled: Boolean(userId && projectId),
    queryFn: async () => (await apiFetch<Event[]>(`/events?projectId=${projectId}`)).data,
  });
  const createEvent = useMutation({
    mutationFn: async (input: any) => (await apiFetch<Event>('/events', { method: 'POST', body: input })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', projectId] }),
  });
  const updateEvent = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Event> }) =>
      (await apiFetch<Event>(`/events/${id}`, { method: 'PUT', body: patch })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', projectId] }),
  });
  const removeEvent = useMutation({
    mutationFn: async (id: string) => { await apiFetch(`/events/${id}`, { method: 'DELETE' }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', projectId] }),
  });

  // Funnels
  const funnelsQuery = useQuery({
    queryKey: ['funnels', userId, projectId],
    enabled: Boolean(userId && projectId),
    queryFn: async () => (await apiFetch<Funnel[]>(`/funnels/${projectId}`)).data,
  });
  const createFunnel = useMutation({
    mutationFn: async ({ name, steps }: { name: string; steps: { eventId: string; alias?: string }[] }) =>
      (await apiFetch<Funnel>('/funnels', { method: 'POST', body: { projectId, name, steps } })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funnels', projectId] }),
  });
  const removeFunnel = useMutation({
    mutationFn: async (id: string) => { await apiFetch(`/funnels/${id}`, { method: 'DELETE' }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funnels', projectId] }),
  });
  const updateFunnel = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Funnel> }) =>
      (await apiFetch<Funnel>(`/funnels/${id}`, { method: 'PUT', body: patch })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['funnels', projectId] }),
  });

  // Frames (designs)
  const framesQuery = useQuery({
    queryKey: ['frames', userId, projectId],
    enabled: Boolean(userId && projectId),
    queryFn: async () => (await apiFetch<any[]>(`/designs/${projectId}/frames`)).data,
  });

  // Dashboard
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', userId, projectId],
    enabled: Boolean(userId && projectId),
    queryFn: async () => (await apiFetch<any[]>(`/dashboards/${projectId}/basic`)).data,
  });

  // Event counts by project
  const projectIds = (projectsQuery.data ?? []).map((p) => p._id).join(',');
  const countsQuery = useQuery({
    queryKey: ['event-counts', userId, projectIds],
    enabled: Boolean(userId && (projectsQuery.data ?? []).length > 0),
    queryFn: async () => (await apiFetch<Record<string, number>>(`/events/counts?projectIds=${projectIds}`)).data,
  });

  const connectionsQuery = useQuery({
    queryKey: ['connections', userId, projectIds],
    enabled: Boolean(userId && (projectsQuery.data ?? []).length > 0),
    queryFn: async () => {
      console.log('[DEBUG] Fetching connections for projects:', projectIds);
      try {
        const result = await apiFetch<Record<string, string[]>>(`/integrations/connections?projectIds=${projectIds}`);
        console.log('[DEBUG] Connections response:', result);
        return result.data;
      } catch (error) {
        console.error('[DEBUG] Error fetching connections:', error);
        throw error;
      }
    },
  });

  // Measurement (on-demand)
  async function getDatalayer(format: 'json' | 'js') {
    if (!projectId) return '';
    const res = await apiFetch<string>(`/measurement/datalayer?projectId=${projectId}&format=${format}`);
    return res.data as unknown as string;
  }

  // Verification
  const [runId, setRunId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const verifyQuery = useQuery({
    queryKey: ['verification', runId],
    enabled: Boolean(runId),
    refetchInterval: (q: any) => (!q?.state?.data || q.state.data.status === 'running' ? 1500 : false),
    queryFn: async () => (await apiFetch<any>(`/verification/${runId}`)).data,
  });
  async function runVerification() {
    if (!projectId) return;
    setRunning(true);
    const res = await apiFetch<any>('/verification/run', { method: 'POST', body: { projectId } });
    setRunId(res.data._id);
    setRunning(false);
  }

  // Integrations
  const containersQuery = useQuery({
    queryKey: ['gtm-containers', userId],
    enabled: Boolean(userId),
    queryFn: async () => (await apiFetch<any[]>('/integrations/gtm/containers')).data,
  });

  // Figma files query - GLOBAL POR USUARIO, no por proyecto
  const figmaFilesQuery = useQuery({
    queryKey: ['figma-files', userId], // Solo depende del usuario, NO del proyecto
    enabled: Boolean(userId), // Solo necesitamos que haya un usuario logueado
    queryFn: async () => {
      console.log('[DEBUG] Fetching Figma files for user (GLOBAL):', userId);
      try {
        const result = await apiFetch<FigmaFile[]>('/integrations/figma/files');
        console.log('[DEBUG] Figma files response (GLOBAL):', result);
        
        // Si hay error en la respuesta, devolver array vacío en lugar de fallar
        if ((result as any).error) {
          console.warn('[DEBUG] Figma API returned error, returning empty array:', (result as any).error);
          return [];
        }
        
        return Array.isArray(result.data) ? result.data : [];
      } catch (error) {
        console.error('[DEBUG] Error fetching Figma files:', error);
        // En lugar de lanzar el error, devolver array vacío
        return [];
      }
    },
  });

  // Project Figma file association query
  const projectFigmaFileQuery = useQuery({
    queryKey: ['project-figma-file', projectId, userId],
    enabled: Boolean(projectId && userId),
    queryFn: async () => {
      console.log('[DEBUG] Fetching project Figma file for project:', projectId, 'user:', userId);
      try {
        const result = await apiFetch<ProjectFigmaFile>(`/integrations/figma/project/${projectId}/file`);
        console.log('[DEBUG] Project Figma file response:', result);
        return result.data;
      } catch (error) {
        console.error('[DEBUG] Error fetching project Figma file:', error);
        // Don't throw on 404, just return null
        if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  async function connectGtm() { await apiFetch('/integrations/gtm/connect', { method: 'POST' }); containersQuery.refetch(); }
  async function connectGa4() { await apiFetch('/integrations/ga4/connect', { method: 'POST' }); connectionsQuery.refetch(); }
  async function connectFigma() { 
    await apiFetch('/integrations/figma/connect', { method: 'POST' }); 
    connectionsQuery.refetch();
    figmaFilesQuery.refetch(); 
  }

  // Figma file assignment functions
  async function assignFigmaFile(fileKey: string, fileName: string, fileUrl?: string) {
    if (!projectId) throw new Error('No project selected');
    console.log('[DEBUG] Assigning Figma file:', { projectId, fileKey, fileName });
    try {
      await apiFetch(`/integrations/figma/project/${projectId}/file`, {
        method: 'POST',
        body: { fileKey, fileName, fileUrl }
      });
      console.log('[DEBUG] Successfully assigned Figma file');
      projectFigmaFileQuery.refetch();
      framesQuery.refetch(); // Refetch frames since they depend on the assigned file
    } catch (error) {
      console.error('[DEBUG] Error assigning Figma file:', error);
      throw error;
    }
  }

  async function removeFigmaFile() {
    if (!projectId) throw new Error('No project selected');
    console.log('[DEBUG] Removing Figma file for project:', projectId);
    try {
      await apiFetch(`/integrations/figma/project/${projectId}/file`, {
        method: 'DELETE'
      });
      console.log('[DEBUG] Successfully removed Figma file');
      projectFigmaFileQuery.refetch();
      framesQuery.refetch(); // Refetch frames since they depend on the assigned file
    } catch (error) {
      console.error('[DEBUG] Error removing Figma file:', error);
      throw error;
    }
  }

  const value = useMemo<DataContextType>(() => ({
    projects: {
      items: projectsQuery.data ?? [],
      loading: projectsQuery.isLoading,
      refetch: () => projectsQuery.refetch(),
      create: async (name: string, description?: string) => createProject.mutateAsync({ name, description }),
      update: async (id, patch) => updateProject.mutateAsync({ id, patch }),
      remove: async (id) => removeProject.mutateAsync(id),
    },
    events: {
      items: eventsQuery.data ?? [],
      loading: eventsQuery.isLoading,
      refetch: () => eventsQuery.refetch(),
      create: async (input) => createEvent.mutateAsync(input),
      update: async (id, patch) => updateEvent.mutateAsync({ id, patch }),
      remove: async (id) => removeEvent.mutateAsync(id),
    },
    funnels: {
      items: funnelsQuery.data ?? [],
      loading: funnelsQuery.isLoading,
      refetch: () => funnelsQuery.refetch(),
      create: async (name, steps) => createFunnel.mutateAsync({ name, steps }),
      update: async (id, patch) => updateFunnel.mutateAsync({ id, patch }),
      remove: async (id) => removeFunnel.mutateAsync(id),
    },
    frames: {
      items: framesQuery.data ?? [],
      loading: framesQuery.isLoading,
      refetch: () => framesQuery.refetch(),
    },
    dashboard: {
      cards: dashboardQuery.data ?? [],
      loading: dashboardQuery.isLoading,
      refetch: () => dashboardQuery.refetch(),
    },
    eventCounts: countsQuery.data ?? {},
    connections: connectionsQuery.data ?? {},
    measurement: {
      get: getDatalayer,
    },
    verification: {
      runId,
      results: (verifyQuery.data?.results as any[]) ?? [],
      running,
      run: runVerification,
    },
    integrations: {
      gtmContainers: containersQuery.data ?? [],
      loading: containersQuery.isLoading,
      refetch: () => containersQuery.refetch(),
      connectGtm,
      connectGa4,
      connectFigma,
      figmaFiles: {
        items: figmaFilesQuery.data ?? [],
        loading: figmaFilesQuery.isLoading,
        refetch: () => figmaFilesQuery.refetch(),
      },
      projectFigmaFile: {
        data: projectFigmaFileQuery.data ?? null,
        loading: projectFigmaFileQuery.isLoading,
        refetch: () => projectFigmaFileQuery.refetch(),
        assign: assignFigmaFile,
        remove: removeFigmaFile,
      },
    },
  }), [
    projectsQuery.data, projectsQuery.isLoading,
    eventsQuery.data, eventsQuery.isLoading,
    funnelsQuery.data, funnelsQuery.isLoading,
    framesQuery.data, framesQuery.isLoading,
    dashboardQuery.data, dashboardQuery.isLoading,
    verifyQuery.data, runId, running,
    containersQuery.data, containersQuery.isLoading,
    figmaFilesQuery.data, figmaFilesQuery.isLoading,
    projectFigmaFileQuery.data, projectFigmaFileQuery.isLoading,
    countsQuery.data, connectionsQuery.data,
    userId
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

// Hook para acceder a datos de Figma por proyecto específico
export function useProjectIntegrations(projectId?: string) {
  const { connections } = useData();
  
  // Obtener conexiones específicas del proyecto
  const projectConnections = projectId ? connections[projectId] || [] : [];
  const figmaConnected = projectConnections.includes('FIGMA');
  const ga4Connected = projectConnections.includes('GA4');
  
  // Query para archivos de Figma específicos del proyecto
  const figmaFilesQuery = useQuery({
    queryKey: ['project-figma-files', projectId],
    enabled: Boolean(projectId && figmaConnected),
    queryFn: async () => {
      console.log('[DEBUG] Fetching Figma files for project:', projectId);
      try {
        const result = await apiFetch<FigmaFile[]>(`/integrations/figma/project/${projectId}/files`);
        console.log('[DEBUG] Project Figma files response:', result);
        
        if ((result as any).error) {
          console.warn('[DEBUG] Figma API returned error, returning empty array:', (result as any).error);
          return [];
        }
        
        return Array.isArray(result.data) ? result.data : [];
      } catch (error) {
        console.error('[DEBUG] Error fetching project Figma files:', error);
        return [];
      }
    },
  });

  async function connectFigmaForProject() {
    if (!projectId) return;
    try {
      const result = await apiFetch<{ url: string }>(`/integrations/figma/oauth/url?projectId=${projectId}`);
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      console.error('Error connecting Figma for project:', error);
    }
  }

  async function connectGA4ForProject() {
    if (!projectId) return;
    try {
      const result = await apiFetch<{ url: string }>(`/integrations/ga4/oauth/url?projectId=${projectId}`);
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      console.error('Error connecting GA4 for project:', error);
    }
  }

  async function disconnectFigmaFromProject() {
    if (!projectId) return;
    try {
      await apiFetch(`/integrations/connections?projectId=${projectId}&platform=FIGMA`, { 
        method: 'DELETE' 
      });
      // Refrescar las conexiones para actualizar el estado
      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting Figma from project:', error);
    }
  }

  async function disconnectGA4FromProject() {
    if (!projectId) return;
    try {
      await apiFetch(`/integrations/connections?projectId=${projectId}&platform=GA4`, { 
        method: 'DELETE' 
      });
      // Refrescar las conexiones para actualizar el estado
      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting GA4 from project:', error);
    }
  }

  return {
    projectId,
    figmaConnected,
    ga4Connected,
    figmaFiles: figmaFilesQuery.data || [],
    isLoadingFigmaFiles: figmaFilesQuery.isLoading,
    connectFigmaForProject,
    connectGA4ForProject,
    disconnectFigmaFromProject,
    disconnectGA4FromProject,
    refetchFigmaFiles: () => figmaFilesQuery.refetch(),
  };
}

// Hook para acceder a datos de Figma a nivel GLOBAL (mantenido para compatibilidad)
export function useFigmaConnection() {
  const { integrations } = useData();
  return {
    figmaFiles: integrations.figmaFiles.items,
    isLoadingFigmaFiles: integrations.figmaFiles.loading,
    figmaConnected: integrations.figmaFiles.items.length > 0,
    connectFigma: integrations.connectFigma,
    refetchFigmaFiles: integrations.figmaFiles.refetch,
  };
}

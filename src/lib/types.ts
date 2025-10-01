export type ApiResponse<T> = { data: T; error?: any; meta?: any };

// Figma types
export interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url?: string;
  last_modified?: string;
  url?: string;
  // Metadata adicional del backend
  teamName?: string;
  teamId?: string;
  projectName?: string;
  projectId?: string;
  description?: string;
}

export interface FigmaFrame {
  id: string;
  name: string;
  thumbUrl?: string;
}

export interface ProjectFigmaFile {
  projectId: string;
  userId: string;
  figmaFileKey: string;
  figmaFileName: string;
  figmaFileUrl?: string;
}

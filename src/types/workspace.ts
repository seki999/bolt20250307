// src/types/workspace.ts
export interface Workspace {
  id: number;
  name: string;
  description?: string; // Optional property
  // Add other properties related to your workspace here
  created_at?: Date;
  updated_at?: Date;
}

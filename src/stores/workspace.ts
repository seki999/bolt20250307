import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

// Define an interface for the Workspace object
interface Workspace {
  id: number;
  name: string;
  userId: number;
  key: string;
  type: string;
  createdAt: string;
  createdBy: string;
  maxApps: number;
  assignedCount: number;
  unassignedCount: number;
  assigned:boolean;
  // Add other properties if needed
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>([])
  const currentWorkspace = ref<Workspace | null>(null)
  const loading = ref(false)
  const error = ref('')

  async function fetchWorkspaces(userId: number) {
    loading.value = true
    error.value = ''
    
    try {
      const response = await axios.get('http://localhost:3001/workspaces', {
        params: { userId }
      })
      
      workspaces.value = response.data
      // Check if response.data is not null or undefined before accessing its length
      if (Array.isArray(response.data) && response.data.length > 0 && !currentWorkspace.value) {
          currentWorkspace.value = workspaces.value[0];
      }
    } catch (err) {
      error.value = 'Failed to fetch workspaces'
    } finally {
      loading.value = false
    }
  }

  function setCurrentWorkspace(workspace: Workspace) {
    currentWorkspace.value = workspace
  }

  return {
    workspaces,
    currentWorkspace,
    loading,
    error,
    fetchWorkspaces,
    setCurrentWorkspace
  }
})

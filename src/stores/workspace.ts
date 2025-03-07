import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref([])
  const currentWorkspace = ref(null)
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
      
      if (workspaces.value.length > 0 && !currentWorkspace.value) {
        currentWorkspace.value = workspaces.value[0]
      }
    } catch (err) {
      error.value = 'Failed to fetch workspaces'
    } finally {
      loading.value = false
    }
  }

  function setCurrentWorkspace(workspace) {
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
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import axios from 'axios'

const workspaceStore = useWorkspaceStore()
const activeTab = ref('export') // 'export' or 'import'
const apps = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const selectedApps = ref<number[]>([])
const uploadedFile = ref<File | null>(null)

const currentWorkspaceId = computed(() => {
  return workspaceStore.currentWorkspace?.id
})

onMounted(() => {
  if (currentWorkspaceId.value) {
    fetchApps()
  }
})

watch(() => currentWorkspaceId.value, () => {
  if (currentWorkspaceId.value) {
    fetchApps()
  }
})

async function fetchApps() {
  if (!currentWorkspaceId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.get('http://localhost:3001/apps', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    apps.value = response.data
  } catch (err) {
    error.value = 'Failed to fetch apps'
  } finally {
    loading.value = false
  }
}

function setActiveTab(tab: string) {
  activeTab.value = tab
  selectedApps.value = []
}

function toggleAppSelection(appId: number) {
  const index = selectedApps.value.indexOf(appId)
  if (index === -1) {
    selectedApps.value.push(appId)
  } else {
    selectedApps.value.splice(index, 1)
  }
}

async function exportApps() {
  if (selectedApps.value.length === 0) {
    error.value = 'Please select at least one app to export'
    return
  }
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    // In a real app, this would trigger a server-side export process
    // Here we're just simulating it
    const selectedAppData = apps.value.filter(app => selectedApps.value.includes(app.id))
    const exportData = {
      apps: selectedAppData,
      version: '1.0.0', // Current app version
      exportDate: new Date().toISOString()
    }
    
    // Simulate file download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `app-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    success.value = 'Apps exported successfully'
  } catch (err) {
    error.value = 'Failed to export apps'
  } finally {
    loading.value = false
  }
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    uploadedFile.value = input.files[0]
  }
}

async function importApps() {
  if (!uploadedFile.value) {
    error.value = 'Please select a file to import'
    return
  }
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    // In a real app, this would handle the actual file upload and import process
    // Here we're just simulating it
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        
        // Version check
        const currentVersion = '1.0.0' // Current app version
        if (importData.version > currentVersion) {
          error.value = 'Cannot import data from a newer version of the application'
          loading.value = false
          return
        }
        
        // Simulate import process
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        success.value = 'Apps imported successfully'
        uploadedFile.value = null
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } catch (err) {
        error.value = 'Invalid import file format'
      }
    }
    reader.readAsText(uploadedFile.value)
  } catch (err) {
    error.value = 'Failed to import apps'
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Migration</h1>
      
      <!-- Tab Navigation -->
      <div class="flex border-b border-gray-200 mb-6">
        <button
          @click="setActiveTab('export')"
          class="py-2 px-4 font-medium text-sm focus:outline-none"
          :class="activeTab === 'export' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
        >
          Export
        </button>
        <button
          @click="setActiveTab('import')"
          class="py-2 px-4 font-medium text-sm focus:outline-none"
          :class="activeTab === 'import' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
        >
          Import
        </button>
      </div>
      
      <!-- Success Message -->
      <div 
        v-if="success"
        class="mb-4 p-3 bg-green-100 text-green-700 rounded flex items-center justify-between"
      >
        {{ success }}
        <button @click="success = ''" class="text-green-700 hover:text-green-900">×</button>
      </div>
      
      <!-- Error Message -->
      <div 
        v-if="error"
        class="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-center justify-between"
      >
        {{ error }}
        <button @click="error = ''" class="text-red-700 hover:text-red-900">×</button>
      </div>
      
      <!-- Export Tab Content -->
      <div v-if="activeTab === 'export'" class="space-y-6">
        <div v-if="loading" class="flex justify-center my-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        
        <div v-else-if="apps.length === 0" class="text-center my-8 text-gray-500">
          No apps available for export.
        </div>
        
        <div v-else class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  App Name
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engine Version
                </th>
                <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="app in apps" :key="app.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ app.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">1.0.0</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <input 
                    type="checkbox"
                    :checked="selectedApps.includes(app.id)"
                    @change="toggleAppSelection(app.id)"
                    class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="flex justify-end">
          <button 
            @click="exportApps"
            class="btn btn-primary"
            :disabled="selectedApps.length === 0 || loading"
          >
            {{ loading ? 'Exporting...' : 'Export Selected' }}
          </button>
        </div>
      </div>
      
      <!-- Import Tab Content -->
      <div v-else class="space-y-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="mb-6">
            <label 
              for="file-upload"
              class="block text-primary hover:text-primary-dark font-medium cursor-pointer"
            >
              Upload ZIP File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".json,.zip"
              class="hidden"
              @change="handleFileUpload"
            />
          </div>
          
          <p class="text-sm text-gray-600 mb-6">
            Please ensure the folder structure matches the exported ZIP file.
          </p>
          
          <div v-if="uploadedFile" class="mb-4">
            <p class="text-sm text-gray-700">
              Selected file: {{ uploadedFile.name }}
            </p>
          </div>
          
          <div class="flex justify-end">
            <button 
              @click="importApps"
              class="btn btn-primary"
              :disabled="!uploadedFile || loading"
            >
              {{ loading ? 'Importing...' : 'Import' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
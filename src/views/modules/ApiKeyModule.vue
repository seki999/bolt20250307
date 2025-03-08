<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import axios from 'axios'

const workspaceStore = useWorkspaceStore()
const apiKeys = ref([])
const endpoints = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const showNewKeyModal = ref(false)
const showEditKeyModal = ref(false)

const newApiKey = ref({
  name: '',
  endpoint: '',
  expiration: ''
})

const editingApiKey = ref(null)

const currentWorkspaceId = computed(() => {
  return workspaceStore.currentWorkspace?.id
})

onMounted(() => {
  if (currentWorkspaceId.value) {
    fetchApiKeys()
    fetchEndpoints()
  }
})

watch(() => currentWorkspaceId.value, () => {
  if (currentWorkspaceId.value) {
    fetchApiKeys()
    fetchEndpoints()
  }
})

async function fetchApiKeys() {
  if (!currentWorkspaceId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.get('http://localhost:3001/apiKeys', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    apiKeys.value = response.data
  } catch (err) {
    error.value = 'Failed to fetch API keys'
  } finally {
    loading.value = false
  }
}

async function fetchEndpoints() {
  if (!currentWorkspaceId.value) return
  
  try {
    const response = await axios.get('http://localhost:3001/endpoints', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    endpoints.value = response.data
  } catch (err) {
    console.error('Failed to fetch endpoints')
  }
}

function openNewKeyModal() {
  newApiKey.value = {
    name: '',
    endpoint: '',
    expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default to 1 year
  }
  showNewKeyModal.value = true
}

async function createApiKey() {
  if (!currentWorkspaceId.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await axios.post('http://localhost:3001/apiKeys', {
      ...newApiKey.value,
      key: `api_key_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: currentWorkspaceId.value
    })
    
    showNewKeyModal.value = false
    success.value = 'API key created successfully'
    await fetchApiKeys()
  } catch (err) {
    error.value = 'Failed to create API key'
  } finally {
    loading.value = false
  }
}

function openEditModal(apiKey) {
  editingApiKey.value = { ...apiKey }
  showEditKeyModal.value = true
}

async function updateApiKey() {
  if (!editingApiKey.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await axios.put(`http://localhost:3001/apiKeys/${editingApiKey.value.id}`, editingApiKey.value)
    showEditKeyModal.value = false
    success.value = 'API key updated successfully'
    await fetchApiKeys()
  } catch (err) {
    error.value = 'Failed to update API key'
  } finally {
    loading.value = false
  }
}

async function deleteApiKey(id: number) {
  if (!confirm('Are you sure you want to delete this API key?')) return
  
  loading.value = true
  error.value = ''
  
  try {
    await axios.delete(`http://localhost:3001/apiKeys/${id}`)
    success.value = 'API key deleted successfully'
    await fetchApiKeys()
  } catch (err) {
    error.value = 'Failed to delete API key'
  } finally {
    loading.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function getEndpointName(endpointPath: string) {
  const endpoint = endpoints.value.find(e => e.path === endpointPath)
  return endpoint ? endpoint.name : endpointPath
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">API Keys</h1>
      
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
      
      <!-- Action Button -->
      <div class="mb-6">
        <button 
          @click="openNewKeyModal"
          class="btn btn-primary"
        >
          Create API Key
        </button>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      
      <!-- API Keys Table -->
      <div v-else-if="apiKeys.length === 0" class="text-center my-8 text-gray-500">
        No API keys found. Create a new API key to get started.
      </div>
      
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                API Name
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Endpoints
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiration Date
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="apiKey in apiKeys" :key="apiKey.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ apiKey.name }}</div>
                <div class="text-xs text-gray-500">{{ apiKey.key }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ getEndpointName(apiKey.endpoint) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ formatDate(apiKey.expiration) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  @click="openEditModal(apiKey)"
                  class="text-primary hover:text-primary-dark mr-3"
                >
                  Edit
                </button>
                <button 
                  @click="deleteApiKey(apiKey.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- New API Key Modal -->
      <div v-if="showNewKeyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">Create New API Key</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">API Name</label>
              <input 
                v-model="newApiKey.name"
                type="text"
                class="input"
                placeholder="Enter API name"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
              <select v-model="newApiKey.endpoint" class="input">
                <option value="">Select an endpoint</option>
                <option v-for="endpoint in endpoints" :key="endpoint.id" :value="endpoint.path">
                  {{ endpoint.name }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
              <input 
                v-model="newApiKey.expiration"
                type="date"
                class="input"
              />
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-6">
            <button 
              @click="showNewKeyModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="createApiKey"
              class="btn btn-primary"
              :disabled="loading"
            >
              {{ loading ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Edit API Key Modal -->
      <div v-if="showEditKeyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">Edit API Key</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">API Name</label>
              <input 
                v-model="editingApiKey.name"
                type="text"
                class="input"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
              <select v-model="editingApiKey.endpoint" class="input">
                <option value="">Select an endpoint</option>
                <option v-for="endpoint in endpoints" :key="endpoint.id" :value="endpoint.path">
                  {{ endpoint.name }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
              <input 
                v-model="editingApiKey.expiration"
                type="date"
                class="input"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <div class="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                {{ editingApiKey?.key }}
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-6">
            <button 
              @click="showEditKeyModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="updateApiKey"
              class="btn btn-primary"
              :disabled="loading"
            >
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import axios from 'axios'

const workspaceStore = useWorkspaceStore()
const activeTab = ref('http') // 'http' or 'table'
const endpoints = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const showNewEndpointModal = ref(false)
const showEditEndpointModal = ref(false)

const newEndpoint = ref({
  name: '',
  destination: '',
  apiKey: '',
  type: 'http'
})

const editingEndpoint = ref(null)

const currentWorkspaceId = computed(() => {
  return workspaceStore.currentWorkspace?.id
})

const filteredEndpoints = computed(() => {
  return endpoints.value.filter(endpoint => endpoint.type === activeTab.value)
})

onMounted(() => {
  if (currentWorkspaceId.value) {
    fetchEndpoints()
  }
})

watch(() => currentWorkspaceId.value, () => {
  if (currentWorkspaceId.value) {
    fetchEndpoints()
  }
})

async function fetchEndpoints() {
  if (!currentWorkspaceId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.get('http://localhost:3001/endpoints', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    endpoints.value = response.data
  } catch (err) {
    error.value = 'Failed to fetch endpoints'
  } finally {
    loading.value = false
  }
}

function setActiveTab(tab: string) {
  activeTab.value = tab
}

function openNewEndpointModal() {
  newEndpoint.value = {
    name: '',
    destination: '',
    apiKey: '',
    type: activeTab.value
  }
  showNewEndpointModal.value = true
}

async function createEndpoint() {
  if (!currentWorkspaceId.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await axios.post('http://localhost:3001/endpoints', {
      ...newEndpoint.value,
      workspaceId: currentWorkspaceId.value
    })
    
    showNewEndpointModal.value = false
    success.value = 'Endpoint created successfully'
    await fetchEndpoints()
  } catch (err) {
    error.value = 'Failed to create endpoint'
  } finally {
    loading.value = false
  }
}

function openEditModal(endpoint) {
  editingEndpoint.value = { ...endpoint }
  showEditEndpointModal.value = true
}

async function updateEndpoint() {
  if (!editingEndpoint.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await axios.put(`http://localhost:3001/endpoints/${editingEndpoint.value.id}`, editingEndpoint.value)
    showEditEndpointModal.value = false
    success.value = 'Endpoint updated successfully'
    await fetchEndpoints()
  } catch (err) {
    error.value = 'Failed to update endpoint'
  } finally {
    loading.value = false
  }
}

async function deleteEndpoint(id: number) {
  if (!confirm('Are you sure you want to delete this endpoint?')) return
  
  loading.value = true
  error.value = ''
  
  try {
    await axios.delete(`http://localhost:3001/endpoints/${id}`)
    success.value = 'Endpoint deleted successfully'
    await fetchEndpoints()
  } catch (err) {
    error.value = 'Failed to delete endpoint'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Endpoints</h1>
      
      <!-- Tab Navigation -->
      <div class="flex border-b border-gray-200 mb-6">
        <button
          @click="setActiveTab('http')"
          class="py-2 px-4 font-medium text-sm focus:outline-none"
          :class="activeTab === 'http' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
        >
          Data Input (HTTP)
        </button>
        <button
          @click="setActiveTab('table')"
          class="py-2 px-4 font-medium text-sm focus:outline-none"
          :class="activeTab === 'table' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
        >
          Table API
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
      
      <!-- Action Button -->
      <div class="mb-6">
        <button 
          @click="openNewEndpointModal"
          class="btn btn-primary"
        >
          Add {{ activeTab === 'http' ? 'HTTP' : 'Table API' }} Endpoint
        </button>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      
      <!-- Endpoints Table -->
      <div v-else-if="filteredEndpoints.length === 0" class="text-center my-8 text-gray-500">
        No endpoints found. Create a new endpoint to get started.
      </div>
      
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Endpoint Name
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Setting Destination
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                API Key
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="endpoint in filteredEndpoints" :key="endpoint.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ endpoint.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ endpoint.destination }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ endpoint.apiKey }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  @click="openEditModal(endpoint)"
                  class="text-primary hover:text-primary-dark mr-3"
                >
                  Edit
                </button>
                <button 
                  @click="deleteEndpoint(endpoint.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- New Endpoint Modal -->
      <div v-if="showNewEndpointModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">
            Add New {{ activeTab === 'http' ? 'HTTP' : 'Table API' }} Endpoint
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Endpoint Name</label>
              <input 
                v-model="newEndpoint.name"
                type="text"
                class="input"
                placeholder="Enter endpoint name"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Setting Destination</label>
              <input 
                v-model="newEndpoint.destination"
                type="text"
                class="input"
                placeholder="Enter destination"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input 
                v-model="newEndpoint.apiKey"
                type="text"
                class="input"
                placeholder="Enter API key"
              />
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-6">
            <button 
              @click="showNewEndpointModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="createEndpoint"
              class="btn btn-primary"
              :disabled="loading"
            >
              {{ loading ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Edit Endpoint Modal -->
      <div v-if="showEditEndpointModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">Edit Endpoint</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Endpoint Name</label>
              <input 
                v-model="editingEndpoint.name"
                type="text"
                class="input"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Setting Destination</label>
              <input 
                v-model="editingEndpoint.destination"
                type="text"
                class="input"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input 
                v-model="editingEndpoint.apiKey"
                type="text"
                class="input"
              />
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-6">
            <button 
              @click="showEditEndpointModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="updateEndpoint"
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
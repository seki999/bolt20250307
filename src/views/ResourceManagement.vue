<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useWorkspaceStore } from '../stores/workspace'
import axios from 'axios'

const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const loading = ref(false)
const error = ref('')
const success = ref('')
const resources = ref([])
const showNewResourceModal = ref(false)
const showEditResourceModal = ref(false)
const newResource = ref({
  name: '',
  type: 'cpu', // cpu, memory, storage, network
  limit: 0,
  used: 0,
  status: 'active'
})
const editingResource = ref(null)

const resourceTypes = [
  { value: 'cpu', label: 'CPU' },
  { value: 'memory', label: 'Memory' },
  { value: 'storage', label: 'Storage' },
  { value: 'network', label: 'Network' }
]

const usagePercentage = computed(() => (resource) => {
  return ((resource.used / resource.limit) * 100).toFixed(1)
})

onMounted(async () => {
  await fetchResources()
})

async function fetchResources() {
  if (!authStore.user?.id) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.get('http://localhost:3001/resources', {
      params: { userId: authStore.user.id }
    })
    resources.value = response.data
  } catch (err) {
    error.value = 'Failed to fetch resources'
  } finally {
    loading.value = false
  }
}

function openNewResourceModal() {
  newResource.value = {
    name: '',
    type: 'cpu',
    limit: 0,
    used: 0,
    status: 'active'
  }
  showNewResourceModal.value = true
}

async function createResource() {
  if (!authStore.user?.id) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await axios.post('http://localhost:3001/resources', {
      ...newResource.value,
      userId: authStore.user.id,
      workspaceId: workspaceStore.currentWorkspace?.id
    })
    
    showNewResourceModal.value = false
    success.value = 'Resource created successfully'
    await fetchResources()
  } catch (err) {
    error.value = 'Failed to create resource'
  } finally {
    loading.value = false
  }
}

function openEditModal(resource) {
  editingResource.value = { ...resource }
  showEditResourceModal.value = true
}

async function updateResource() {
  if (!editingResource.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await axios.put(`http://localhost:3001/resources/${editingResource.value.id}`, editingResource.value)
    showEditResourceModal.value = false
    success.value = 'Resource updated successfully'
    await fetchResources()
  } catch (err) {
    error.value = 'Failed to update resource'
  } finally {
    loading.value = false
  }
}

async function deleteResource(id: number) {
  if (!confirm('Are you sure you want to delete this resource?')) return
  
  loading.value = true
  error.value = ''
  
  try {
    await axios.delete(`http://localhost:3001/resources/${id}`)
    success.value = 'Resource deleted successfully'
    await fetchResources()
  } catch (err) {
    error.value = 'Failed to delete resource'
  } finally {
    loading.value = false
  }
}

function getResourceTypeLabel(type: string) {
  return resourceTypes.find(t => t.value === type)?.label || type
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Resource Management</h1>
        <button 
          @click="openNewResourceModal"
          class="btn btn-primary"
        >
          Add Resource
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
      
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      
      <!-- Resources Grid -->
      <div v-else-if="resources.length === 0" class="text-center my-8 text-gray-500">
        No resources found. Add a resource to get started.
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="resource in resources" 
          :key="resource.id"
          class="bg-white rounded-lg shadow-md p-6"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-medium text-gray-900">{{ resource.name }}</h3>
              <p class="text-sm text-gray-500">{{ getResourceTypeLabel(resource.type) }}</p>
            </div>
            <div class="flex space-x-2">
              <button 
                @click="openEditModal(resource)"
                class="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button 
                @click="deleteResource(resource.id)"
                class="text-gray-400 hover:text-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-500">Usage</span>
                <span class="font-medium">{{ usagePercentage(resource) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full"
                  :class="{
                    'bg-green-500': usagePercentage(resource) < 70,
                    'bg-yellow-500': usagePercentage(resource) >= 70 && usagePercentage(resource) < 90,
                    'bg-red-500': usagePercentage(resource) >= 90
                  }"
                  :style="{ width: `${usagePercentage(resource)}%` }"
                ></div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-gray-500">Limit</p>
                <p class="font-medium">{{ resource.limit }}</p>
              </div>
              <div>
                <p class="text-gray-500">Used</p>
                <p class="font-medium">{{ resource.used }}</p>
              </div>
            </div>
            
            <div class="pt-4 border-t border-gray-200">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-800': resource.status === 'active',
                  'bg-yellow-100 text-yellow-800': resource.status === 'warning',
                  'bg-red-100 text-red-800': resource.status === 'critical'
                }"
              >
                {{ resource.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- New Resource Modal -->
      <div v-if="showNewResourceModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">Add New Resource</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
              <input 
                v-model="newResource.name"
                type="text"
                class="input"
                placeholder="Enter resource name"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select v-model="newResource.type" class="input">
                <option v-for="type in resourceTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Limit</label>
              <input 
                v-model.number="newResource.limit"
                type="number"
                class="input"
                min="0"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="newResource.status" class="input">
                <option value="active">Active</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-6">
            <button 
              @click="showNewResourceModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="createResource"
              class="btn btn-primary"
              :disabled="loading"
            >
              {{ loading ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Edit Resource Modal -->
      <div v-if="showEditResourceModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">Edit Resource</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
              <input 
                v-model="editingResource.name"
                type="text"
                class="input"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select v-model="editingResource.type" class="input">
                <option v-for="type in resourceTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Limit</label>
              <input 
                v-model.number="editingResource.limit"
                type="number"
                class="input"
                min="0"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Used</label>
              <input 
                v-model.number="editingResource.used"
                type="number"
                class="input"
                min="0"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="editingResource.status" class="input">
                <option value="active">Active</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-6">
            <button 
              @click="showEditResourceModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="updateResource"
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
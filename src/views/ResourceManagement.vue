<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useWorkspaceStore } from '../stores/workspace'
import axios from 'axios'

const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const activeTab = ref('tenant')
const loading = ref(false)
const error = ref('')
const success = ref('')

// Tenant Management Data
const tenants = ref([])
const expandedTenants = ref(new Set())
const tenantWorkspaces = ref({})
const showNewTenantModal = ref(false)
const showEditTenantModal = ref(false)
const editingTenant = ref(null)

// New Tenant Data
const newTenant = ref({
  name: '',
  companyName: '',
  workspaceLimit: 5,
  userLimit: 20
})

// Physical Workspace Management Data
const physicalWorkspaces = ref([])
const expandedWorkspaces = ref(new Set())
const logicalWorkspaces = ref({})
const showAssignWorkspaceModal = ref(false)
const selectedWorkspace = ref(null)

// User Management Data
const users = ref([])

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  loading.value = true
  error.value = ''
  
  try {
    switch (activeTab.value) {
      case 'tenant':
        await fetchTenants()
        break
      case 'workspace':
        await fetchPhysicalWorkspaces()
        break
      case 'user':
        await fetchUsers()
        break
    }
  } catch (err) {
    error.value = 'Failed to fetch data'
  } finally {
    loading.value = false
  }
}

async function fetchTenants() {
  const response = await axios.get('http://localhost:3001/tenants')
  tenants.value = response.data
  
  for (const tenantId of expandedTenants.value) {
    await fetchTenantWorkspaces(tenantId)
  }
}

async function fetchTenantWorkspaces(tenantId: number) {
  try {
    const response = await axios.get('http://localhost:3001/workspaces', {
      params: { tenantId }
    })
    tenantWorkspaces.value[tenantId] = response.data
  } catch (err) {
    console.error('Failed to fetch tenant workspaces:', err)
  }
}

async function toggleTenantExpansion(tenantId: number) {
  if (expandedTenants.value.has(tenantId)) {
    expandedTenants.value.delete(tenantId)
    delete tenantWorkspaces.value[tenantId]
  } else {
    expandedTenants.value.add(tenantId)
    await fetchTenantWorkspaces(tenantId)
  }
}

async function fetchPhysicalWorkspaces() {
  const response = await axios.get('http://localhost:3001/workspaces')
  physicalWorkspaces.value = response.data
  
  for (const workspaceId of expandedWorkspaces.value) {
    await fetchLogicalWorkspaces(workspaceId)
  }
}

async function fetchLogicalWorkspaces(physicalWorkspaceId: number) {
  try {
    const response = await axios.get('http://localhost:3001/workspaces/logical', {
      params: { physicalWorkspaceId }
    })
    logicalWorkspaces.value[physicalWorkspaceId] = response.data
  } catch (err) {
    console.error('Failed to fetch logical workspaces:', err)
  }
}

async function toggleWorkspaceExpansion(workspaceId: number) {
  if (expandedWorkspaces.value.has(workspaceId)) {
    expandedWorkspaces.value.delete(workspaceId)
    delete logicalWorkspaces.value[workspaceId]
  } else {
    expandedWorkspaces.value.add(workspaceId)
    await fetchLogicalWorkspaces(workspaceId)
  }
}

async function fetchUsers() {
  const response = await axios.get('http://localhost:3001/users')
  users.value = response.data
}

function setActiveTab(tab: string) {
  activeTab.value = tab
  fetchData()
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}

// Tenant Management Functions
async function createTenant() {
  if (!newTenant.value.name || !newTenant.value.companyName) {
    error.value = 'Name and Company Name are required'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await axios.post('http://localhost:3001/tenants', {
      ...newTenant.value,
      createdAt: new Date().toISOString(),
      createdBy: authStore.user?.name || 'Admin User',
      workspaceCount: 0,
      userCount: 0,
      status: 'Active'
    })

    showNewTenantModal.value = false
    success.value = 'Tenant created successfully'
    await fetchTenants()

    newTenant.value = {
      name: '',
      companyName: '',
      workspaceLimit: 5,
      userLimit: 20
    }
  } catch (err) {
    error.value = 'Failed to create tenant'
  } finally {
    loading.value = false
  }
}

async function stopTenant(tenantId: number) {
  try {
    await axios.put(`http://localhost:3001/tenants/${tenantId}`, { status: 'Stopped' })
    success.value = 'Tenant stopped successfully'
    await fetchTenants()
  } catch (err) {
    error.value = 'Failed to stop tenant'
  }
}

async function deleteTenant(tenantId: number) {
  if (!confirm('Are you sure you want to delete this tenant?')) return
  
  try {
    await axios.delete(`http://localhost:3001/tenants/${tenantId}`)
    success.value = 'Tenant deleted successfully'
    await fetchTenants()
  } catch (err) {
    error.value = 'Failed to delete tenant'
  }
}

// Workspace Management Functions
async function deleteLogicalWorkspace(workspaceId: number) {
  if (!confirm('Are you sure you want to delete this logical workspace?')) return
  
  try {
    await axios.delete(`http://localhost:3001/workspaces/logical/${workspaceId}`)
    success.value = 'Logical workspace deleted successfully'
    await fetchPhysicalWorkspaces()
  } catch (err) {
    error.value = 'Failed to delete logical workspace'
  }
}

async function editLogicalWorkspace(workspace) {
  // Implement edit functionality
  console.log('Edit workspace:', workspace)
}

// User Management Functions
async function deleteUser(userId: number) {
  if (!confirm('Are you sure you want to delete this user?')) return
  
  try {
    await axios.delete(`http://localhost:3001/users/${userId}`)
    success.value = 'User deleted successfully'
    await fetchUsers()
  } catch (err) {
    error.value = 'Failed to delete user'
  }
}

async function reissueUserCredentials(userId: number) {
  try {
    await axios.post(`http://localhost:3001/users/${userId}/reissue`)
    success.value = 'User credentials reissued successfully'
  } catch (err) {
    error.value = 'Failed to reissue user credentials'
  }
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Resource Management</h1>
      
      <!-- Tab Navigation -->
      <div class="flex border-b border-gray-200 mb-6">
        <button
          @click="setActiveTab('tenant')"
          class="py-2 px-4 font-medium text-sm focus:outline-none"
          :class="activeTab === 'tenant' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
        >
          Tenant Management
        </button>
        <button
          @click="setActiveTab('workspace')"
          class="py-2 px-4 font-medium text-sm focus:outline-none"
          :class="activeTab === 'workspace' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
        >
          Workspace Management
        </button>
        <button
          @click="setActiveTab('user')"
          class="py-2 px-4 font-medium text-sm focus:outline-none"
          :class="activeTab === 'user' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
        >
          User Management
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
      
      <!-- Tenant Management Tab -->
      <div v-else-if="activeTab === 'tenant'" class="space-y-4">
        <!-- Create Tenant Button -->
        <div class="flex justify-end mb-4">
          <button 
            @click="showNewTenantModal = true"
            class="btn btn-primary"
          >
            Create New Tenant
          </button>
        </div>

        <!-- Tenants Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="w-8 px-6 py-3"></th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant Name
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workspaces
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <template v-for="tenant in tenants" :key="tenant.id">
                <!-- Tenant Row -->
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button 
                      @click="toggleTenantExpansion(tenant.id)"
                      class="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <svg 
                        class="w-4 h-4 transform transition-transform"
                        :class="{ 'rotate-90': expandedTenants.has(tenant.id) }"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ tenant.name }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{{ tenant.companyName }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{{ formatDate(tenant.createdAt) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{{ tenant.createdBy }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">
                      {{ tenant.workspaceCount }} / {{ tenant.workspaceLimit }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">
                      {{ tenant.userCount }} / {{ tenant.userLimit }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-green-100 text-green-800': tenant.status === 'Active',
                        'bg-red-100 text-red-800': tenant.status === 'Stopped'
                      }"
                    >
                      {{ tenant.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      v-if="tenant.status === 'Active'"
                      @click="stopTenant(tenant.id)"
                      class="text-yellow-600 hover:text-yellow-900 mr-2"
                    >
                      Stop
                    </button>
                    <button 
                      @click="deleteTenant(tenant.id)"
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                
                <!-- Workspace Sub-rows -->
                <tr v-if="expandedTenants.has(tenant.id)" class="bg-gray-50">
                  <td colspan="9" class="px-6 py-4">
                    <div class="border rounded-lg overflow-hidden">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-100">
                          <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Logical Workspace Name
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created Date
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created By
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Max Apps
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Running Apps
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          <tr v-for="workspace in tenantWorkspaces[tenant.id]" :key="workspace.id">
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-900">{{ workspace.name }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-500">{{ workspace.type }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-500">{{ formatDate(workspace.createdAt) }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-500">{{ workspace.createdBy }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-500">{{ workspace.maxApps }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-500">{{ workspace.assignedCount }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <span 
                                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                :class="{
                                  'bg-green-100 text-green-800': workspace.assigned,
                                  'bg-yellow-100 text-yellow-800': !workspace.assigned
                                }"
                              >
                                {{ workspace.assigned ? 'Active' : 'Inactive' }}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- New Tenant Modal -->
        <div v-if="showNewTenantModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">Create New Tenant</h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                <input 
                  v-model="newTenant.name"
                  type="text"
                  class="input"
                  placeholder="Enter tenant name"
                  required
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input 
                  v-model="newTenant.companyName"
                  type="text"
                  class="input"
                  placeholder="Enter company name"
                  required
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Workspace Limit</label>
                <input 
                  v-model.number="newTenant.workspaceLimit"
                  type="number"
                  min="1"
                  class="input"
                  required
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">User Limit</label>
                <input 
                  v-model.number="newTenant.userLimit"
                  type="number"
                  min="1"
                  class="input"
                  required
                />
              </div>
            </div>
            
            <div class="flex justify-end space-x-2 mt-6">
              <button 
                @click="showNewTenantModal = false"
                class="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                @click="createTenant"
                class="btn btn-primary"
                :disabled="loading"
              >
                {{ loading ? 'Creating...' : 'Create Tenant' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Physical Workspace Management Tab -->
      <div v-else-if="activeTab === 'workspace'" class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="w-8 px-6 py-3"></th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Physical Workspace Name
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workspace ID
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workspace Key
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created Date
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Apps
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignment
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="workspace in physicalWorkspaces" :key="workspace.id">
              <!-- Physical Workspace Row -->
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button 
                    @click="toggleWorkspaceExpansion(workspace.id)"
                    class="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg 
                      class="w-4 h-4 transform transition-transform"
                      :class="{ 'rotate-90': expandedWorkspaces.has(workspace.id) }"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ workspace.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ workspace.id }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ workspace.key }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ workspace.type }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ formatDate(workspace.createdAt) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ workspace.createdBy }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ workspace.maxApps }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">
                    {{ workspace.assignedCount }} / {{ workspace.unassignedCount }}
                  </div>
                </td>
              </tr>
              
              <!-- Logical Workspace Sub-rows -->
              <tr v-if="expandedWorkspaces.has(workspace.id)" class="bg-gray-50">
                <td colspan="9" class="px-6 py-4">
                  <div class="border rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-100">
                        <tr>
                          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Logical Workspace Name
                          </th>
                          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Belonging Tenant
                          </th>
                          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created Date
                          </th>
                          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created By
                          </th>
                          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Max Apps
                          </th>
                          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Running Apps
                          </th>
                          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="logical in logicalWorkspaces[workspace.id]" :key="logical.id">
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{{ logical.name }}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">{{ logical.tenantName }}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">{{ formatDate(logical.createdAt) }}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">{{ logical.createdBy }}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">{{ logical.maxApps }}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">{{ logical.runningApps }}</div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span 
                              class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                              :class="{
                                'bg-green-100 text-green-800': logical.status === 'Active',
                                'bg-yellow-100 text-yellow-800': logical.status === 'Inactive'
                              }"
                            >
                              {{ logical.status }}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              @click="editLogicalWorkspace(logical)"
                              class="text-primary hover:text-primary-dark mr-2"
                            >
                              Edit
                            </button>
                            <button 
                              @click="deleteLogicalWorkspace(logical.id)"
                              class="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      
      <!-- User Management Tab -->
      <div v-else-if="activeTab === 'user'" class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Name
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email Address
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number of Tenants
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in users" :key="user.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ user.username }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ user.email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ user.tenantCount }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="{
                    'bg-green-100 text-green-800': user.status === 'Active',
                    'bg-red-100 text-red-800': user.status === 'Inactive'
                  }"
                >
                  {{ user.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ formatDate(user.lastLogin) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  @click="reissueUserCredentials(user.id)"
                  class="text-primary hover:text-primary-dark mr-2"
                >
                  Reissue
                </button>
                <button 
                  @click="deleteUser(user.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useWorkspaceStore } from '../stores/workspace'
import axios from 'axios'

const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const activeTab = ref('tenant') // 'tenant', 'workspace', or 'user'
const loading = ref(false)
const error = ref('')
const success = ref('')

// Tenant Management Data
const tenants = ref([])
const showNewTenantModal = ref(false)
const showEditTenantModal = ref(false)
const editingTenant = ref(null)

// Workspace Management Data
const workspaces = ref([])
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
        await fetchWorkspaces()
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
}

async function fetchWorkspaces() {
  const response = await axios.get('http://localhost:3001/workspaces')
  workspaces.value = response.data
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
async function assignWorkspace(workspaceId: number) {
  try {
    await axios.put(`http://localhost:3001/workspaces/${workspaceId}/assign`)
    success.value = 'Workspace assigned successfully'
    await fetchWorkspaces()
  } catch (err) {
    error.value = 'Failed to assign workspace'
  }
}

async function unassignWorkspace(workspaceId: number) {
  try {
    await axios.put(`http://localhost:3001/workspaces/${workspaceId}/unassign`)
    success.value = 'Workspace unassigned successfully'
    await fetchWorkspaces()
  } catch (err) {
    error.value = 'Failed to unassign workspace'
  }
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
      <div v-else-if="activeTab === 'tenant'" class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
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
            <tr v-for="tenant in tenants" :key="tenant.id">
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
          </tbody>
        </table>
      </div>
      
      <!-- Workspace Management Tab -->
      <div v-else-if="activeTab === 'workspace'" class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workspace Name
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
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="workspace in workspaces" :key="workspace.id">
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
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  v-if="!workspace.assigned"
                  @click="assignWorkspace(workspace.id)"
                  class="text-primary hover:text-primary-dark mr-2"
                >
                  Assign
                </button>
                <button 
                  v-else
                  @click="unassignWorkspace(workspace.id)"
                  class="text-yellow-600 hover:text-yellow-900"
                >
                  Unassign
                </button>
              </td>
            </tr>
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
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
const users = ref([])
const workspaces = ref([])
const showNewUserModal = ref(false)
const showEditUserModal = ref(false)
const showPermissionsModal = ref(false)

const newUser = ref({
  username: '',
  password: '',
  name: '',
  email: '',
  company: '',
  role: 'user'
})

const editingUser = ref(null)
const selectedUser = ref(null)
const userWorkspaces = ref([])

const roles = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'user', label: 'User' }
]

const permissions = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
  { value: 'admin', label: 'Admin' }
]

onMounted(async () => {
  await Promise.all([
    fetchUsers(),
    fetchWorkspaces()
  ])
})

async function fetchUsers() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.get('http://localhost:3001/users')
    users.value = response.data
  } catch (err) {
    error.value = 'Failed to fetch users'
  } finally {
    loading.value = false
  }
}

async function fetchWorkspaces() {
  try {
    const response = await axios.get('http://localhost:3001/workspaces')
    workspaces.value = response.data
  } catch (err) {
    console.error('Failed to fetch workspaces', err)
  }
}

async function fetchUserWorkspaces(userId: number) {
  try {
    const response = await axios.get('http://localhost:3001/userWorkspaces', {
      params: { userId }
    })
    userWorkspaces.value = response.data
  } catch (err) {
    console.error('Failed to fetch user workspaces', err)
  }
}

function openNewUserModal() {
  newUser.value = {
    username: '',
    password: '',
    name: '',
    email: '',
    company: '',
    role: 'user'
  }
  showNewUserModal.value = true
}

async function createUser() {
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await axios.post('http://localhost:3001/users', {
      ...newUser.value,
      lastLogin: new Date().toISOString()
    })
    
    showNewUserModal.value = false
    success.value = 'User created successfully'
    await fetchUsers()
  } catch (err) {
    error.value = 'Failed to create user'
  } finally {
    loading.value = false
  }
}

function openEditModal(user) {
  editingUser.value = { ...user }
  showEditUserModal.value = true
}

async function updateUser() {
  if (!editingUser.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await axios.put(`http://localhost:3001/users/${editingUser.value.id}`, editingUser.value)
    showEditUserModal.value = false
    success.value = 'User updated successfully'
    await fetchUsers()
  } catch (err) {
    error.value = 'Failed to update user'
  } finally {
    loading.value = false
  }
}

async function deleteUser(id: number) {
  if (!confirm('Are you sure you want to delete this user?')) return
  
  loading.value = true
  error.value = ''
  
  try {
    await axios.delete(`http://localhost:3001/users/${id}`)
    success.value = 'User deleted successfully'
    await fetchUsers()
  } catch (err) {
    error.value = 'Failed to delete user'
  } finally {
    loading.value = false
  }
}

async function openPermissionsModal(user) {
  selectedUser.value = user
  await fetchUserWorkspaces(user.id)
  showPermissionsModal.value = true
}

async function updatePermissions() {
  if (!selectedUser.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    await axios.put(`http://localhost:3001/userWorkspaces`, userWorkspaces.value)
    showPermissionsModal.value = false
    success.value = 'Permissions updated successfully'
  } catch (err) {
    error.value = 'Failed to update permissions'
  } finally {
    loading.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Administration Settings</h1>
        <button 
          @click="openNewUserModal"
          class="btn btn-primary"
        >
          Add User
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
      
      <!-- Users Table -->
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
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
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                      {{ user.username.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ user.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ user.email }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ user.company }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.lastLogin) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  @click="openPermissionsModal(user)"
                  class="text-primary hover:text-primary-dark mr-3"
                >
                  Permissions
                </button>
                <button 
                  @click="openEditModal(user)"
                  class="text-primary hover:text-primary-dark mr-3"
                >
                  Edit
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
      
      <!-- New User Modal -->
      <div v-if="showNewUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">Add New User</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                v-model="newUser.username"
                type="text"
                class="input"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                v-model="newUser.password"
                type="password"
                class="input"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                v-model="newUser.name"
                type="text"
                class="input"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                v-model="newUser.email"
                type="email"
                class="input"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input 
                v-model="newUser.company"
                type="text"
                class="input"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select v-model="newUser.role" class="input">
                <option v-for="role in roles" :key="role.value" :value="role.value">
                  {{ role.label }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-6">
            <button 
              @click="showNewUserModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="createUser"
              class="btn btn-primary"
              :disabled="loading"
            >
              {{ loading ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Edit User Modal -->
      <div v-if="showEditUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-xl font-bold mb-4">Edit User</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                v-model="editingUser.name"
                type="text"
                class="input"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                v-model="editingUser.email"
                type="email"
                class="input"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input 
                v-model="editingUser.company"
                type="text"
                class="input"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select v-model="editingUser.role" class="input">
                <option v-for="role in roles" :key="role.value" :value="role.value">
                  {{ role.label }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-6">
            <button 
              @click="showEditUserModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="updateUser"
              class="btn btn-primary"
              :disabled="loading"
            >
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Permissions Modal -->
      <div v-if="showPermissionsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
          <h2 class="text-xl font-bold mb-4">
            Workspace Permissions for {{ selectedUser?.name }}
          </h2>
          
          <div class="space-y-4">
            <div v-for="workspace in workspaces" :key="workspace.id" class="p-4 border rounded-lg">
              <div class="flex items-center justify-between">
                <h3 class="font-medium">{{ workspace.name }}</h3>
                <select 
                  v-model="userWorkspaces[workspace.id]"
                  class="input w-auto"
                >
                  <option value="">No Access</option>
                  <option v-for="perm in permissions" :key="perm.value" :value="perm.value">
                    {{ perm.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-6">
            <button 
              @click="showPermissionsModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="updatePermissions"
              class="btn btn-primary"
              :disabled="loading"
            >
              {{ loading ? 'Saving...' : 'Save Permissions' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
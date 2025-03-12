<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import axios from 'axios'

const workspaceStore = useWorkspaceStore()
const apps = ref([])
const loading = ref(false)
const error = ref('')
const showNewAppModal = ref(false)
const showEditAppModal = ref(false)
const newAppName = ref('')
const editingApp = ref(null)

const currentWorkspaceId = computed(() => {
  return workspaceStore.currentWorkspace?.id
})

onMounted(() => {
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

async function createApp() {
  if (!newAppName.value || !currentWorkspaceId.value) return
  
  try {
    await axios.post('http://localhost:3001/apps', {
      name: newAppName.value,
      status: 'Stopped',
      workspaceId: currentWorkspaceId.value
    })
    
    newAppName.value = ''
    showNewAppModal.value = false
    await fetchApps()
  } catch (err) {
    error.value = 'Failed to create app'
  }
}

async function updateApp() {
  if (!editingApp.value) return
  
  try {
    await axios.put(`http://localhost:3001/apps/${editingApp.value.id}`, editingApp.value)
    showEditAppModal.value = false
    editingApp.value = null
    await fetchApps()
  } catch (err) {
    error.value = 'Failed to update app'
  }
}

async function deleteApp(id: number) {
  if (!confirm('Are you sure you want to delete this app?')) return
  
  try {
    await axios.delete(`http://localhost:3001/apps/${id}`)
    await fetchApps()
  } catch (err) {
    error.value = 'Failed to delete app'
  }
}

function openEditModal(app) {
  editingApp.value = { ...app }
  showEditAppModal.value = true
}

function toggleAppStatus(app) {
  const updatedApp = {
    ...app,
    status: app.status === 'Running' ? 'Stopped' : 'Running'
  }
  
  axios.put(`http://localhost:3001/apps/${app.id}`, updatedApp)
    .then(() => fetchApps())
    .catch(() => {
      error.value = 'Failed to update app status'
    })
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Apps</h1>
      <button @click="showNewAppModal = true" class="btn btn-primary">
        New App
      </button>
    </div>
    
    <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
      {{ error }}
    </div>
    
    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <div v-else-if="apps.length === 0" class="text-center my-8 text-gray-500">
      No apps found. Create a new app to get started.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Changed to grid layout -->
      <div
        v-for="app in apps"
        :key="app.id"
        class="bg-white rounded-lg shadow p-4 flex flex-col justify-between"
      >
        <!-- flex-col and justify-between for vertical alignment -->
        <div>
        <div class="flex items-center space-x-4 mb-4">
          <div
            class="w-3 h-3 rounded-full"
            :class="app.status === 'Running' ? 'bg-green-500' : 'bg-red-500'"
          ></div>
          <span class="font-medium">{{ app.name }}</span>
          <span class="text-sm text-gray-500">{{ app.status }}</span>
        </div>
        </div>
        <div class="flex space-x-2 mt-auto"> <!-- mt-auto to push buttons to bottom -->
          <button
            @click="toggleAppStatus(app)"
            class="btn btn-secondary text-sm"
          >
            {{ app.status === 'Running' ? 'Stop' : 'Start' }}
          </button>
          <button
            @click="openEditModal(app)"
            class="btn btn-secondary text-sm"
          >
            Edit
          </button>
          <button
            @click="deleteApp(app.id)"
            class="btn bg-red-500 text-white hover:bg-red-600 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- New App Modal -->
    <div
      v-if="showNewAppModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Create New App</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >App Name</label
          >
          <input
            v-model="newAppName"
            type="text"
            class="input"
            placeholder="Enter app name"
          />
        </div>

        <div class="flex justify-end space-x-2">
          <button @click="showNewAppModal = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="createApp" class="btn btn-primary">
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- Edit App Modal -->
    <div
      v-if="showEditAppModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Edit App</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >App Name</label
          >
          <input v-model="editingApp.name" type="text" class="input" />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Status</label
          >
          <select v-model="editingApp.status" class="input">
            <option value="Running">Running</option>
            <option value="Stopped">Stopped</option>
          </select>
        </div>

        <div class="flex justify-end space-x-2">
          <button @click="showEditAppModal = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="updateApp" class="btn btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

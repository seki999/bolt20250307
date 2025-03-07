<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import axios from 'axios'

const workspaceStore = useWorkspaceStore()
const migrations = ref([])
const apps = ref([])
const tables = ref([])
const loading = ref(false)
const error = ref('')
const activeTab = ref('export') // 'export' or 'import'
const showNewMigrationModal = ref(false)
const newMigration = ref({
  name: '',
  type: 'export',
  content: {
    apps: [],
    tables: []
  }
})
const selectedApps = ref([])
const selectedTables = ref([])
const importFile = ref(null)
const showWorkspaceDropdown = ref(false)

const currentWorkspaceId = computed(() => {
  return workspaceStore.currentWorkspace?.id
})

onMounted(() => {
  if (currentWorkspaceId.value) {
    fetchMigrations()
    fetchApps()
    fetchTables()
  }
})

watch(() => currentWorkspaceId.value, () => {
  if (currentWorkspaceId.value) {
    fetchMigrations()
    fetchApps()
    fetchTables()
  }
})

async function fetchMigrations() {
  if (!currentWorkspaceId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.get('http://localhost:3001/migrations', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    migrations.value = response.data
  } catch (err) {
    error.value = 'Failed to fetch migrations'
  } finally {
    loading.value = false
  }
}

async function fetchApps() {
  if (!currentWorkspaceId.value) return
  
  try {
    const response = await axios.get('http://localhost:3001/apps', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    apps.value = response.data
  } catch (err) {
    console.error('Failed to fetch apps', err)
  }
}

async function fetchTables() {
  if (!currentWorkspaceId.value) return
  
  try {
    const response = await axios.get('http://localhost:3001/tables', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    tables.value = response.data
  } catch (err) {
    console.error('Failed to fetch tables', err)
  }
}

function setActiveTab(tab) {
  activeTab.value = tab
}

function openNewMigrationModal() {
  newMigration.value = {
    name: '',
    type: activeTab.value,
    content: {
      apps: [],
      tables: []
    }
  }
  selectedApps.value = []
  selectedTables.value = []
  showNewMigrationModal.value = true
}

function toggleAppSelection(appId) {
  const index = selectedApps.value.indexOf(appId)
  if (index === -1) {
    selectedApps.value.push(appId)
  } else {
    selectedApps.value.splice(index, 1)
  }
}

function toggleTableSelection(tableId) {
  const index = selectedTables.value.indexOf(tableId)
  if (index === -1) {
    selectedTables.value.push(tableId)
  } else {
    selectedTables.value.splice(index, 1)
  }
}

async function createMigration() {
  if (!newMigration.value.name || !currentWorkspaceId.value) return
  
  try {
    await axios.post('http://localhost:3001/migrations', {
      name: newMigration.value.name,
      type: activeTab.value,
      date: new Date().toISOString(),
      content: {
        apps: selectedApps.value,
        tables: selectedTables.value
      },
      workspaceId: currentWorkspaceId.value
    })
    
    showNewMigrationModal.value = false
    await fetchMigrations()
  } catch (err) {
    error.value = 'Failed to create migration'
  }
}

function importMigration() {
  // In a real app, this would handle actual file import
  // Here we're just showing an alert
  alert('Import functionality would be implemented here')
}

function getAppNames(appIds) {
  return appIds.map(id => {
    const app = apps.value.find(a => a.id === id)
    return app ? app.name : `App ${id}`
  }).join(', ')
}

function getTableNames(tableIds) {
  return tableIds.map(id => {
    const table = tables.value.find(t => t.id === id)
    return table ? table.name : `Table ${id}`
  }).join(', ')
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Migrations</h1>
      <button 
        @click="openNewMigrationModal"
        class="btn btn-primary"
      >
        {{ activeTab === 'export' ? 'New Export' : 'New Import' }}
      </button>
    </div>
    
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
    
    <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
      {{ error }}
    </div>
    
    <!-- Export Tab -->
    <div v-if="activeTab === 'export'">
      <div v-if="loading" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      
      <div v-else-if="migrations.filter(m => m.type === 'export').length === 0" class="text-center my-8 text-gray-500">
        No exports found. Create a new export to get started.
      </div>
      
      <div v-else class="space-y-4">
        <div 
          v-for="migration in migrations.filter(m => m.type === 'export')" 
          :key="migration.id"
          class="bg-white rounded-lg shadow p-4"
        >
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium text-lg">{{ migration.name }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ formatDate(migration.date) }}</p>
              
              <div class="mt-3 space-y-2">
                <div v-if="migration.content.apps && migration.content.apps.length > 0">
                  <p class="text-sm font-medium">Apps:</p>
                  <p class="text-sm text-gray-600">{{ getAppNames(migration.content.apps) }}</p>
                </div>
                
                <div v-if="migration.content.tables && migration.content.tables.length > 0">
                  <p class="text-sm font-medium">Tables:</p>
                  <p class="text-sm text-gray-600">{{ getTableNames(migration.content.tables) }}</p>
                </div>
              </div>
            </div>
            
            <button 
              class="btn btn-secondary text-sm"
              @click="alert('Download export file')"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Import Tab -->
    <div v-else-if="activeTab === 'import'">
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-medium mb-4">Import Migration</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Migration File</label>
            <input 
              type="file"
              class="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary-dark"
            />
          </div>
          
          <button 
            @click="importMigration"
            class="btn btn-primary"
          >
            Import
          </button>
        </div>
      </div>
      
      <h3 class="font-medium text-lg mb-4">Import History</h3>
      
      <div v-if="loading" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      
      <div v-else-if="migrations.filter(m => m.type === 'import').length === 0" class="text-center my-8 text-gray-500">
        No imports found.
      </div>
      
      <div v-else class="space-y-4">
        <div 
          v-for="migration in migrations.filter(m => m.type === 'import')" 
          :key="migration.id"
          class="bg-white rounded-lg shadow p-4"
        >
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium text-lg">{{ migration.name }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ formatDate(migration.date) }}</p>
              
              <div class="mt-3 space-y-2">
                <div v-if="migration.content.apps && migration.content.apps.length > 0">
                  <p class="text-sm font-medium">Apps:</p>
                  <p class="text-sm text-gray-600">{{ getAppNames(migration.content.apps) }}</p>
                </div>
                
                <div v-if="migration.content.tables && migration.content.tables.length > 0">
                  <p class="text-sm font-medium">Tables:</p>
                  <p class="text-sm text-gray-600">{{ getTableNames(migration.content.tables) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- New Migration Modal -->
    <div v-if="showNewMigrationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Create New {{ activeTab === 'export' ? 'Export' : 'Import' }}</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input 
              v-model="newMigration.name"
              type="text"
              class="input"
              placeholder="Enter a name for this migration"
            />
          </div>
          
          <div v-if="activeTab === 'export'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Apps</label>
            <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
              <div 
                v-for="app in apps" 
                :key="app.id"
                class="flex items-center p-2 hover:bg-gray-50"
              >
                <input 
                  type="checkbox"
                  :id="`app-${app.id}`"
                  :value="app.id"
                  v-model="selectedApps"
                  class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label :for="`app-${app.id}`" class="ml-2 block text-sm text-gray-900">
                  {{ app.name }}
                </label>
              </div>
            </div>
          </div>
          
          <div v-if="activeTab === 'export'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Tables</label>
            <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
              <div 
                v-for="table in tables" 
                :key="table.id"
                class="flex items-center p-2 hover:bg-gray-50"
              >
                <input 
                  type="checkbox"
                  :id="`table-${table.id}`"
                  :value="table.id"
                  v-model="selectedTables"
                  class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label :for="`table-${table.id}`" class="ml-2 block text-sm text-gray-900">
                  {{ table.name }}
                </label>
              </div>
            </div>
          </div>
          
          <div v-if="activeTab === 'import'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Import File</label>
            <input 
              type="file"
              class="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary-dark"
            />
          </div>
        </div>
        
        <div class="flex justify-end space-x-2 mt-6">
          <button 
            @click="showNewMigrationModal = false"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="createMigration"
            class="btn btn-primary"
          >
            {{ activeTab === 'export' ? 'Export' : 'Import' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import axios from 'axios'

const workspaceStore = useWorkspaceStore()
const tables = ref([])
const selectedTable = ref(null)
const loading = ref(false)
const error = ref('')
const showNewTableModal = ref(false)
const showEditTableModal = ref(false)
const newTableName = ref('')
const newTableFields = ref([{ name: '', type: 'string', primary: false }])
const editingTable = ref(null)
const editingFields = ref([])
const showWorkspaceDropdown = ref(false)

const currentWorkspaceId = computed(() => {
  return workspaceStore.currentWorkspace?.id
})

onMounted(() => {
  if (currentWorkspaceId.value) {
    fetchTables()
  }
})

watch(() => currentWorkspaceId.value, () => {
  if (currentWorkspaceId.value) {
    fetchTables()
  }
})

async function fetchTables() {
  if (!currentWorkspaceId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.get('http://localhost:3001/tables', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    tables.value = response.data
    
    if (tables.value.length > 0 && !selectedTable.value) {
      selectTable(tables.value[0])
    } else if (tables.value.length === 0) {
      selectedTable.value = null
    }
  } catch (err) {
    error.value = 'Failed to fetch tables'
  } finally {
    loading.value = false
  }
}

function selectTable(table) {
  selectedTable.value = table
}

function addNewField() {
  newTableFields.value.push({ name: '', type: 'string', primary: false })
}

function removeField(index) {
  newTableFields.value.splice(index, 1)
}

function addEditField() {
  editingFields.value.push({ name: '', type: 'string', primary: false })
}

function removeEditField(index) {
  editingFields.value.splice(index, 1)
}

async function createTable() {
  if (!newTableName.value || !currentWorkspaceId.value) return
  
  // Validate fields
  if (newTableFields.value.some(field => !field.name)) {
    error.value = 'All fields must have a name'
    return
  }
  
  try {
    await axios.post('http://localhost:3001/tables', {
      name: newTableName.value,
      fields: newTableFields.value,
      workspaceId: currentWorkspaceId.value
    })
    
    newTableName.value = ''
    newTableFields.value = [{ name: '', type: 'string', primary: false }]
    showNewTableModal.value = false
    await fetchTables()
  } catch (err) {
    error.value = 'Failed to create table'
  }
}

function openEditModal(table) {
  editingTable.value = { ...table }
  editingFields.value = [...table.fields]
  showEditTableModal.value = true
}

async function updateTable() {
  if (!editingTable.value) return
  
  // Validate fields
  if (editingFields.value.some(field => !field.name)) {
    error.value = 'All fields must have a name'
    return
  }
  
  try {
    await axios.put(`http://localhost:3001/tables/${editingTable.value.id}`, {
      ...editingTable.value,
      fields: editingFields.value
    })
    
    showEditTableModal.value = false
    editingTable.value = null
    editingFields.value = []
    await fetchTables()
  } catch (err) {
    error.value = 'Failed to update table'
  }
}

async function deleteTable(id: number) {
  if (!confirm('Are you sure you want to delete this table?')) return
  
  try {
    await axios.delete(`http://localhost:3001/tables/${id}`)
    
    if (selectedTable.value && selectedTable.value.id === id) {
      selectedTable.value = null
    }
    
    await fetchTables()
  } catch (err) {
    error.value = 'Failed to delete table'
  }
}
</script>

<template>
  <div class="p-6 h-full">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Tables</h1>
      <button 
        @click="showNewTableModal = true"
        class="btn btn-primary"
      >
        New Table
      </button>
    </div>
    
    <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
      {{ error }}
    </div>
    
    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="tables.length === 0" class="text-center my-8 text-gray-500">
      No tables found. Create a new table to get started.
    </div>
    
    <div v-else class="flex h-[calc(100%-4rem)]">
      <!-- Table List -->
      <div class="w-1/3 pr-4 overflow-y-auto border-r border-gray-200">
        <div class="space-y-2">
          <div 
            v-for="table in tables" 
            :key="table.id"
            class="p-3 rounded-lg cursor-pointer transition-colors"
            :class="selectedTable && selectedTable.id === table.id ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'"
            @click="selectTable(table)"
          >
            <div class="font-medium">{{ table.name }}</div>
            <div class="text-sm" :class="selectedTable && selectedTable.id === table.id ? 'text-white opacity-80' : 'text-gray-500'">
              {{ table.fields.length }} fields
            </div>
          </div>
        </div>
      </div>
      
      <!-- Table Details -->
      <div class="w-2/3 pl-4 overflow-y-auto">
        <div v-if="selectedTable" class="bg-white rounded-lg shadow p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">{{ selectedTable.name }}</h2>
            <div class="flex space-x-2">
              <button 
                @click="openEditModal(selectedTable)"
                class="btn btn-secondary text-sm"
              >
                Edit
              </button>
              <button 
                @click="deleteTable(selectedTable.id)"
                class="btn bg-red-500 text-white hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Name
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Primary Key
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="field in selectedTable.fields" :key="field.name">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ field.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ field.type }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span v-if="field.primary" class="text-green-600">Yes</span>
                    <span v-else>No</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          Select a table to view details
        </div>
      </div>
    </div>
    
    <!-- New Table Modal -->
    <div v-if="showNewTableModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Create New Table</h2>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
          <input 
            v-model="newTableName"
            type="text"
            class="input"
            placeholder="Enter table name"
          />
        </div>
        
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">Fields</label>
            <button 
              @click="addNewField"
              class="text-primary hover:text-primary-dark text-sm"
            >
              + Add Field
            </button>
          </div>
          
          <div v-for="(field, index) in newTableFields" :key="index" class="flex space-x-2 mb-2">
            <div class="flex-1">
              <input 
                v-model="field.name"
                type="text"
                class="input"
                placeholder="Field name"
              />
            </div>
            <div class="w-1/3">
              <select v-model="field.type" class="input">
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="datetime">DateTime</option>
              </select>
            </div>
            <div class="w-1/4 flex items-center">
              <label class="inline-flex items-center">
                <input type="checkbox" v-model="field.primary" class="form-checkbox h-4 w-4 text-primary">
                <span class="ml-2 text-sm text-gray-700">Primary</span>
              </label>
            </div>
            <button 
              @click="removeField(index)"
              class="text-red-500 hover:text-red-700"
              :disabled="newTableFields.length === 1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2">
          <button 
            @click="showNewTableModal = false"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="createTable"
            class="btn btn-primary"
          >
            Create
          </button>
        </div>
      </div>
    </div>
    
    <!-- Edit Table Modal -->
    <div v-if="showEditTableModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Edit Table</h2>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
          <input 
            v-model="editingTable.name"
            type="text"
            class="input"
          />
        </div>
        
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-medium text-gray-700">Fields</label>
            <button 
              @click="addEditField"
              class="text-primary hover:text-primary-dark text-sm"
            >
              + Add Field
            </button>
          </div>
          
          <div v-for="(field, index) in editingFields" :key="index" class="flex space-x-2 mb-2">
            <div class="flex-1">
              <input 
                v-model="field.name"
                type="text"
                class="input"
                placeholder="Field name"
              />
            </div>
            <div class="w-1/3">
              <select v-model="field.type" class="input">
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="datetime">DateTime</option>
              </select>
            </div>
            <div class="w-1/4 flex items-center">
              <label class="inline-flex items-center">
                <input type="checkbox" v-model="field.primary" class="form-checkbox h-4 w-4 text-primary">
                <span class="ml-2 text-sm text-gray-700">Primary</span>
              </label>
            </div>
            <button 
              @click="removeEditField(index)"
              class="text-red-500 hover:text-red-700"
              :disabled="editingFields.length === 1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2">
          <button 
            @click="showEditTableModal = false"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="updateTable"
            class="btn btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
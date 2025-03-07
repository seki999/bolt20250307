<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import axios from 'axios'

const workspaceStore = useWorkspaceStore()
const messageBlockers = ref([])
const loading = ref(false)
const error = ref('')
const showNewBlockerModal = ref(false)
const showEditBlockerModal = ref(false)
const newBlocker = ref({
  username: '',
  password: '',
  ipWhitelist: [],
  description: '',
  topics: 0
})
const editingBlocker = ref(null)
const ipInput = ref('')
const editIpInput = ref('')
const showWorkspaceDropdown = ref(false)

const currentWorkspaceId = computed(() => {
  return workspaceStore.currentWorkspace?.id
})

onMounted(() => {
  if (currentWorkspaceId.value) {
    fetchMessageBlockers()
  }
})

watch(() => currentWorkspaceId.value, () => {
  if (currentWorkspaceId.value) {
    fetchMessageBlockers()
  }
})

async function fetchMessageBlockers() {
  if (!currentWorkspaceId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.get('http://localhost:3001/messageBlockers', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    messageBlockers.value = response.data
  } catch (err) {
    error.value = 'Failed to fetch message blockers'
  } finally {
    loading.value = false
  }
}

function addIpToWhitelist() {
  if (!ipInput.value) return
  
  // Simple IP validation
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipPattern.test(ipInput.value)) {
    error.value = 'Invalid IP address format'
    return
  }
  
  newBlocker.value.ipWhitelist.push(ipInput.value)
  ipInput.value = ''
}

function removeIpFromWhitelist(ip) {
  newBlocker.value.ipWhitelist = newBlocker.value.ipWhitelist.filter(i => i !== ip)
}

function addIpToEditWhitelist() {
  if (!editIpInput.value || !editingBlocker.value) return
  
  // Simple IP validation
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipPattern.test(editIpInput.value)) {
    error.value = 'Invalid IP address format'
    return
  }
  
  editingBlocker.value.ipWhitelist.push(editIpInput.value)
  editIpInput.value = ''
}

function removeIpFromEditWhitelist(ip) {
  if (!editingBlocker.value) return
  editingBlocker.value.ipWhitelist = editingBlocker.value.ipWhitelist.filter(i => i !== ip)
}

function openNewBlockerModal() {
  newBlocker.value = {
    username: '',
    password: '',
    ipWhitelist: [],
    description: '',
    topics: 0
  }
  ipInput.value = ''
  showNewBlockerModal.value = true
}

async function createMessageBlocker() {
  if (!newBlocker.value.username || !newBlocker.value.password || !currentWorkspaceId.value) return
  
  try {
    await axios.post('http://localhost:3001/messageBlockers', {
      ...newBlocker.value,
      workspaceId: currentWorkspaceId.value
    })
    
    showNewBlockerModal.value = false
    await fetchMessageBlockers()
  } catch (err) {
    error.value = 'Failed to create message blocker'
  }
}

function openEditModal(blocker) {
  editingBlocker.value = { ...blocker }
  editIpInput.value = ''
  showEditBlockerModal.value = true
}

async function updateMessageBlocker() {
  if (!editingBlocker.value) return
  
  try {
    await axios.put(`http://localhost:3001/messageBlockers/${editingBlocker.value.id}`, editingBlocker.value)
    showEditBlockerModal.value = false
    editingBlocker.value = null
    await fetchMessageBlockers()
  } catch (err) {
    error.value = 'Failed to update message blocker'
  }
}

async function deleteMessageBlocker(id: number) {
  if (!confirm('Are you sure you want to delete this message blocker?')) return
  
  try {
    await axios.delete(`http://localhost:3001/messageBlockers/${id}`)
    await fetchMessageBlockers()
  } catch (err) {
    error.value = 'Failed to delete message blocker'
  }
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Message Blockers</h1>
      <button 
        @click="openNewBlockerModal"
        class="btn btn-primary"
      >
        New MQTT Blocker
      </button>
    </div>
    
    <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
      {{ error }}
    </div>
    
    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="messageBlockers.length === 0" class="text-center my-8 text-gray-500">
      No message blockers found. Create a new MQTT blocker to get started.
    </div>
    
    <div v-else class="space-y-4">
      <div 
        v-for="blocker in messageBlockers" 
        :key="blocker.id"
        class="bg-white rounded-lg shadow p-4"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-medium text-lg">{{ blocker.description }}</h3>
            <div class="mt-2 space-y-2">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Username</p>
                  <p class="font-medium">{{ blocker.username }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Password</p>
                  <p class="font-medium">•••••••••</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Topics</p>
                  <p class="font-medium">{{ blocker.topics }}</p>
                </div>
              </div>
              
              <div>
                <p class="text-sm text-gray-500 mb-1">IP Whitelist</p>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="ip in blocker.ipWhitelist" 
                    :key="ip"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100"
                  >
                    {{ ip }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button 
              @click="openEditModal(blocker)"
              class="btn btn-secondary text-sm"
            >
              Edit
            </button>
            <button 
              @click="deleteMessageBlocker(blocker.id)"
              class="btn bg-red-500 text-white hover:bg-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- New Message Blocker Modal -->
    <div v-if="showNewBlockerModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Create New MQTT Blocker</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input 
              v-model="newBlocker.description"
              type="text"
              class="input"
              placeholder="Enter a description"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              v-model="newBlocker.username"
              type="text"
              class="input"
              placeholder="MQTT username"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              v-model="newBlocker.password"
              type="password"
              class="input"
              placeholder="MQTT password"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Topics</label>
            <input 
              v-model.number="newBlocker.topics"
              type="number"
              min="0"
              class="input"
              placeholder="Number of topics"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">IP Whitelist</label>
            <div class="flex space-x-2 mb-2">
              <input 
                v-model="ipInput"
                type="text"
                class="input"
                placeholder="192.168.1.1"
              />
              <button 
                @click="addIpToWhitelist"
                class="btn btn-primary whitespace-nowrap"
              >
                Add IP
              </button>
            </div>
            
            <div class="flex flex-wrap gap-2 mt-2">
              <div 
                v-for="ip in newBlocker.ipWhitelist" 
                :key="ip"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100"
              >
                {{ ip }}
                <button 
                  @click="removeIpFromWhitelist(ip)"
                  class="ml-1 text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2 mt-6">
          <button 
            @click="showNewBlockerModal = false"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="createMessageBlocker"
            class="btn btn-primary"
          >
            Create
          </button>
        </div>
      </div>
    </div>
    
    <!-- Edit Message Blocker Modal -->
    <div v-if="showEditBlockerModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Edit MQTT Blocker</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input 
              v-model="editingBlocker.description"
              type="text"
              class="input"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              v-model="editingBlocker.username"
              type="text"
              class="input"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              v-model="editingBlocker.password"
              type="password"
              class="input"
              placeholder="Leave blank to keep current password"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Topics</label>
            <input 
              v-model.number="editingBlocker.topics"
              type="number"
              min="0"
              class="input"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">IP Whitelist</label>
            <div class="flex space-x-2 mb-2">
              <input 
                v-model="editIpInput"
                type="text"
                class="input"
                placeholder="192.168.1.1"
              />
              <button 
                @click="addIpToEditWhitelist"
                class="btn btn-primary whitespace-nowrap"
              >
                Add IP
              </button>
            </div>
            
            <div class="flex flex-wrap gap-2 mt-2">
              <div 
                v-for="ip in editingBlocker?.ipWhitelist" 
                :key="ip"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100"
              >
                {{ ip }}
                <button 
                  @click="removeIpFromEditWhitelist(ip)"
                  class="ml-1 text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2 mt-6">
          <button 
            @click="showEditBlockerModal = false"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="updateMessageBlocker"
            class="btn btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
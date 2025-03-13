<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import axios from 'axios'

const workspaceStore = useWorkspaceStore()
const activeTab = ref('access')
const messageBlockers = ref([])
const expandedRows = ref(new Set())
const serverConfigs = ref([
  { name: 'MQTT Broker URL', value: 'mqtt://broker.example.com:1883' },
  { name: 'Keep Alive Interval', value: '60 seconds' },
  { name: 'QoS Level', value: '1' },
  { name: 'Max Connections', value: '1000' },
  { name: 'SSL/TLS Enabled', value: 'Yes' },
  { name: 'Authentication Method', value: 'Username/Password' },
  { name: 'Retry Interval', value: '5 seconds' },
  { name: 'Message Size Limit', value: '256KB' }
])
const loading = ref(false)
const error = ref('')
const showNewBlockerModal = ref(false)
const showEditBlockerModal = ref(false)
const newBlocker = ref({
  username: '',
  password: '',
  ipWhitelist: [],
  description: '',
  topics: 0,
  topicDetails: []
})
const editingBlocker = ref(null)
const ipInput = ref('')
const editIpInput = ref('')

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

function toggleRow(blockerId: number) {
  if (expandedRows.value.has(blockerId)) {
    expandedRows.value.delete(blockerId)
  } else {
    expandedRows.value.add(blockerId)
  }
}

async function fetchMessageBlockers() {
  if (!currentWorkspaceId.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.get('http://localhost:3001/messageBlockers', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    messageBlockers.value = response.data.map(blocker => ({
      ...blocker,
      topicDetails: [
        { topic: '/sensors/temperature', description: 'Temperature readings', permissions: 'read,write' },
        { topic: '/sensors/humidity', description: 'Humidity readings', permissions: 'read' },
        { topic: '/actuators/lights', description: 'Light controls', permissions: 'write' }
      ]
    }))
  } catch (err) {
    error.value = 'Failed to fetch message blockers'
  } finally {
    loading.value = false
  }
}

function addIpToWhitelist() {
  if (!ipInput.value) return
  
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
    topics: 0,
    topicDetails: []
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

async function deleteTopic(blockerId: number, topic: string) {
  if (!confirm('Are you sure you want to delete this topic?')) return
  
  try {
    const blocker = messageBlockers.value.find(b => b.id === blockerId)
    if (blocker) {
      blocker.topicDetails = blocker.topicDetails.filter(t => t.topic !== topic)
      await updateMessageBlocker(blocker)
    }
  } catch (err) {
    error.value = 'Failed to delete topic'
  }
}

function setActiveTab(tab: string) {
  activeTab.value = tab
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Message Blockers</h1>

      <!-- Tab Navigation -->
      <div class="flex border-b border-gray-200 mb-6">
        <button
          @click="setActiveTab('access')"
          class="py-2 px-4 font-medium text-sm focus:outline-none"
          :class="activeTab === 'access' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
        >
          Access Control
        </button>
        <button
          @click="setActiveTab('server')"
          class="py-2 px-4 font-medium text-sm focus:outline-none"
          :class="activeTab === 'server' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'"
        >
          Server Info
        </button>
      </div>

      <!-- Error Message -->
      <div 
        v-if="error"
        class="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-center justify-between"
      >
        {{ error }}
        <button @click="error = ''" class="text-red-700 hover:text-red-900">×</button>
      </div>

      <!-- Access Control Tab -->
      <div v-if="activeTab === 'access'">
        <!-- Action Button -->
        <div class="mb-6">
          <button @click="openNewBlockerModal" class="btn btn-primary">
            New MQTT Blocker
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center my-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <!-- Message Blockers Table -->
        <div v-else class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="w-8 px-6 py-3"></th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Password
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Whitelist
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topics
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <template v-for="blocker in messageBlockers" :key="blocker.id">
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button 
                      @click="toggleRow(blocker.id)"
                      class="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <svg 
                        class="w-4 h-4 transform transition-transform"
                        :class="{ 'rotate-90': expandedRows.has(blocker.id) }"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ blocker.username }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">•••••••••</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-2">
                      <span 
                        v-for="ip in blocker.ipWhitelist" 
                        :key="ip"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100"
                      >
                        {{ ip }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{{ blocker.description }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{{ blocker.topics }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      @click="openEditModal(blocker)"
                      class="text-primary hover:text-primary-dark mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      @click="deleteMessageBlocker(blocker.id)"
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                <!-- Expanded Topic Details -->
                <tr v-if="expandedRows.has(blocker.id)" class="bg-gray-50">
                  <td colspan="7" class="px-6 py-4">
                    <div class="border rounded-lg overflow-hidden">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-100">
                          <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Topic
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Permissions
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          <tr v-for="topic in blocker.topicDetails" :key="topic.topic">
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-900">{{ topic.topic }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-500">{{ topic.description }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-500">{{ topic.permissions }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                @click="openEditModal(topic)"
                                class="text-primary hover:text-primary-dark mr-3"
                              >
                                Edit
                              </button>
                              <button 
                                @click="deleteTopic(blocker.id, topic.topic)"
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
      </div>

      <!-- Server Info Tab -->
      <div v-else-if="activeTab === 'server'" class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Server Configuration Information
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Configuration Value
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="config in serverConfigs" :key="config.name">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ config.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ config.value }}</div>
              </td>
            </tr>
          </tbody>
        </table>
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
                    ×
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
                    ×
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
  </div>
</template>
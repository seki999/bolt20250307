<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWorkspaceStore } from '../../stores/workspace'
import axios from 'axios'

// Reactive state
const workspaceStore = useWorkspaceStore()
const apiKeys = ref<any[]>([])
const endpoints = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null) // Allow null or string for error message
const showNewKeyModal = ref(false)
const showEditKeyModal = ref(false)
const newApiKey = ref({
  name: '',
  key: '',
  endpoint: '',
  expiration: ''
})
const editingApiKey = ref<any>(null)
const showWorkspaceDropdown = ref(false)

// Computed property for current workspace ID
const currentWorkspaceId = computed(() => {
  return workspaceStore.currentWorkspace?.id
})

// Fetch data on mount
onMounted(() => {
  if (currentWorkspaceId.value) {
    fetchApiKeys()
    fetchEndpoints()
  }
})

// Watch for workspace ID changes
watch(() => currentWorkspaceId.value, (newId) => {
  if (newId) {
    fetchApiKeys()
    fetchEndpoints()
  }
})

// Fetch API keys from the backend
async function fetchApiKeys() {
  if (!currentWorkspaceId.value) return

  loading.value = true
  error.value = null // Reset error

  try {
    const response = await axios.get('http://localhost:3001/apiKeys', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    apiKeys.value = response.data
  } catch (err: any) {
    // Check if the error response contains the rate limit message
    if (err.response?.data?.code === 'rate-limited') {
      error.value = err.response.data.message // Set the raw HTML message
    } else {
      error.value = 'Failed to fetch API keys'
    }
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Fetch endpoints (placeholder implementation)
async function fetchEndpoints() {
  if (!currentWorkspaceId.value) return

  loading.value = true
  error.value = null

  try {
    const response = await axios.get('http://localhost:3001/endpoints', {
      params: { workspaceId: currentWorkspaceId.value }
    })
    endpoints.value = response.data
  } catch (err: any) {
    if (err.response?.data?.code === 'rate-limited') {
      error.value = err.response.data.message
    } else {
      error.value = 'Failed to fetch endpoints'
    }
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="endpoint-module">
    <h1>API Keys & Endpoints</h1>

    <!-- Loading State -->
    <div v-if="loading">Loading...</div>

    <!-- Error State with HTML support -->
    <div v-else-if="error" class="error">
      <span v-html="error"></span> <!-- Render the rate limit message with HTML -->
    </div>

    <!-- Content when loaded and no error -->
    <div v-else>
      <!-- API Keys List -->
      <section>
        <h2>API Keys</h2>
        <ul>
          <li v-for="apiKey in apiKeys" :key="apiKey.key">
            {{ apiKey.name }} - {{ apiKey.endpoint }} (Expires: {{ apiKey.expiration }})
          </li>
        </ul>
      </section>

      <!-- Endpoints List -->
      <section>
        <h2>Endpoints</h2>
        <ul>
          <li v-for="endpoint in endpoints" :key="endpoint.id">
            {{ endpoint.name || endpoint.url }}
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.endpoint-module {
  padding: 20px;
}
.error {
  color: red;
}
.__boltUpgradePlan__ {
  color: blue;
  text-decoration: underline;
  cursor: pointer;
}
</style>
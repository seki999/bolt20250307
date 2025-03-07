<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWorkspaceStore } from '../stores/workspace'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const showUserPopup = ref(false)
const showWorkspaceDropdown = ref(false)

const currentModule = computed(() => {
  return route.name || 'App'
})

onMounted(async () => {
  if (authStore.user) {
    await workspaceStore.fetchWorkspaces(authStore.user.id)
  }
})

watch(() => workspaceStore.currentWorkspace, (newWorkspace) => {
  if (newWorkspace && route.name) {
    // Refresh the current module data when workspace changes
    router.replace({ name: route.name })
  }
})

function navigateTo(path: string) {
  router.push(`/mypage/${path}`)
}

function logout() {
  authStore.logout()
  router.push('/login')
}

function toggleUserPopup() {
  showUserPopup.value = !showUserPopup.value
}

function selectWorkspace(workspace) {
  workspaceStore.setCurrentWorkspace(workspace)
  showWorkspaceDropdown.value = false
}

function navigateToSettings(path: string) {
  router.push(`/mypage/${path}`)
  showUserPopup.value = false
}
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="w-64 bg-gray-800 text-white flex flex-col">
      <!-- Workspace Selector -->
      <div class="p-4 border-b border-gray-700">
        <div class="relative">
          <button 
            class="w-full flex items-center justify-between p-2 bg-gray-700 rounded"
            @click="showWorkspaceDropdown = !showWorkspaceDropdown"
          >
            <span>{{ workspaceStore.currentWorkspace?.name || 'Select Workspace' }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <div v-if="showWorkspaceDropdown" class="absolute w-full mt-1 bg-gray-700 rounded shadow-lg z-10">
            <div 
              v-for="workspace in workspaceStore.workspaces" 
              :key="workspace.id"
              class="p-2 hover:bg-gray-600 cursor-pointer"
              @click="selectWorkspace(workspace)"
            >
              {{ workspace.name }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Navigation Menu -->
      <nav class="flex-1 overflow-y-auto py-4">
        <ul class="space-y-2 px-2">
          <li>
            <button 
              @click="navigateTo('app')" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="currentModule === 'App' ? 'bg-primary text-white' : 'hover:bg-gray-700'"
            >
              App
            </button>
          </li>
          <li>
            <button 
              @click="navigateTo('table')" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="currentModule === 'Table' ? 'bg-primary text-white' : 'hover:bg-gray-700'"
            >
              Table
            </button>
          </li>
          <li>
            <button 
              @click="navigateTo('endpoint')" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="currentModule === 'Endpoint' ? 'bg-primary text-white' : 'hover:bg-gray-700'"
            >
              Endpoint
            </button>
          </li>
          <li>
            <button 
              @click="navigateTo('messageblocker')" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="currentModule === 'MessageBlocker' ? 'bg-primary text-white' : 'hover:bg-gray-700'"
            >
              MessageBlocker
            </button>
          </li>
          <li>
            <button 
              @click="navigateTo('apikey')" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="currentModule === 'ApiKey' ? 'bg-primary text-white' : 'hover:bg-gray-700'"
            >
              API Key
            </button>
          </li>
          <li>
            <button 
              @click="navigateTo('filemanagement')" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="currentModule === 'FileManagement' ? 'bg-primary text-white' : 'hover:bg-gray-700'"
            >
              File Management
            </button>
          </li>
          <li>
            <button 
              @click="navigateTo('migration')" 
              class="w-full text-left px-4 py-2 rounded transition-colors"
              :class="currentModule === 'Migration' ? 'bg-primary text-white' : 'hover:bg-gray-700'"
            >
              Migration
            </button>
          </li>
        </ul>
      </nav>
      
      <!-- User Info -->
      <div class="p-4 border-t border-gray-700 relative">
        <button 
          @click="toggleUserPopup"
          class="flex items-center space-x-2 hover:bg-gray-700 p-2 rounded w-full"
        >
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            {{ authStore.user?.username.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 text-sm truncate">
            {{ authStore.user?.username }}
          </div>
        </button>
        
        <!-- User Popup -->
        <div 
          v-if="showUserPopup"
          class="absolute bottom-16 left-0 w-64 bg-white text-gray-800 rounded shadow-lg p-4 z-10"
        >
          <div class="mb-4">
            <h3 class="font-bold">{{ authStore.user?.name }}</h3>
            <p class="text-sm text-gray-600">{{ authStore.user?.email }}</p>
            <p class="text-sm text-gray-600">{{ authStore.user?.company }}</p>
            <p class="text-sm text-gray-600">{{ authStore.user?.role }}</p>
            <p class="text-sm text-gray-500 mt-2">Last login: {{ new Date(authStore.user?.lastLogin).toLocaleString() }}</p>
          </div>
          
          <div class="space-y-2">
            <button 
              @click="navigateToSettings('personal-settings')"
              class="w-full text-left text-sm hover:bg-gray-100 p-2 rounded"
            >
              Personal Settings
            </button>
            <button 
              @click="navigateToSettings('resource-management')"
              class="w-full text-left text-sm hover:bg-gray-100 p-2 rounded"
            >
              Resource Management
            </button>
            <button 
              @click="navigateToSettings('admin-settings')"
              class="w-full text-left text-sm hover:bg-gray-100 p-2 rounded"
            >
              Administration Settings
            </button>
            <button 
              @click="logout"
              class="w-full text-left text-sm text-red-600 hover:bg-red-50 p-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <router-view />
    </div>
  </div>
</template>
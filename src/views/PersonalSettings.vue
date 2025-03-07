<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const authStore = useAuthStore()
const loading = ref(false)
const error = ref('')
const success = ref('')
const showEditModal = ref(false)
const editingUser = ref({
  name: '',
  email: '',
  company: '',
  role: '',
  password: '',
  newPassword: '',
  confirmPassword: ''
})

onMounted(() => {
  if (authStore.user) {
    editingUser.value = {
      ...editingUser.value,
      ...authStore.user,
      password: '',
      newPassword: '',
      confirmPassword: ''
    }
  }
})

async function updateProfile() {
  if (!authStore.user?.id) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  // Validate passwords if attempting to change
  if (editingUser.value.newPassword) {
    if (!editingUser.value.password) {
      error.value = 'Current password is required to set a new password'
      loading.value = false
      return
    }
    if (editingUser.value.newPassword !== editingUser.value.confirmPassword) {
      error.value = 'New passwords do not match'
      loading.value = false
      return
    }
  }
  
  try {
    const updateData = {
      name: editingUser.value.name,
      email: editingUser.value.email,
      company: editingUser.value.company,
      role: editingUser.value.role
    }
    
    // In a real app, password change would be handled separately with proper encryption
    if (editingUser.value.newPassword) {
      Object.assign(updateData, {
        password: editingUser.value.newPassword
      })
    }
    
    const response = await axios.put(`http://localhost:3001/users/${authStore.user.id}`, updateData)
    
    // Update the store with new user data
    authStore.user = response.data
    success.value = 'Profile updated successfully'
    
    // Clear password fields
    editingUser.value.password = ''
    editingUser.value.newPassword = ''
    editingUser.value.confirmPassword = ''
  } catch (err) {
    error.value = 'Failed to update profile'
  } finally {
    loading.value = false
  }
}

async function deleteAccount() {
  if (!authStore.user?.id || !confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    await axios.delete(`http://localhost:3001/users/${authStore.user.id}`)
    authStore.logout()
  } catch (err) {
    error.value = 'Failed to delete account'
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Personal Settings</h1>
      
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
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <form @submit.prevent="updateProfile" class="space-y-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h2 class="text-lg font-medium text-gray-900">Basic Information</h2>
            
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                id="name"
                v-model="editingUser.name"
                type="text"
                class="mt-1 input"
                required
              />
            </div>
            
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                v-model="editingUser.email"
                type="email"
                class="mt-1 input"
                required
              />
            </div>
            
            <div>
              <label for="company" class="block text-sm font-medium text-gray-700">Company</label>
              <input
                id="company"
                v-model="editingUser.company"
                type="text"
                class="mt-1 input"
              />
            </div>
            
            <div>
              <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
              <input
                id="role"
                v-model="editingUser.role"
                type="text"
                class="mt-1 input"
              />
            </div>
          </div>
          
          <!-- Password Change -->
          <div class="space-y-4">
            <h2 class="text-lg font-medium text-gray-900">Change Password</h2>
            <p class="text-sm text-gray-500">Leave blank if you don't want to change your password</p>
            
            <div>
              <label for="current-password" class="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                id="current-password"
                v-model="editingUser.password"
                type="password"
                class="mt-1 input"
              />
            </div>
            
            <div>
              <label for="new-password" class="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="new-password"
                v-model="editingUser.newPassword"
                type="password"
                class="mt-1 input"
              />
            </div>
            
            <div>
              <label for="confirm-password" class="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                v-model="editingUser.confirmPassword"
                type="password"
                class="mt-1 input"
              />
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              @click="deleteAccount"
              class="btn bg-red-500 text-white hover:bg-red-600"
              :disabled="loading"
            >
              Delete Account
            </button>
            
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loading"
            >
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
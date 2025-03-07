<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // Check if user is logged in
  if (authStore.user) {
    router.push('/mypage')
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <router-view />
  </div>
</template>
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const error = ref('')

  async function login(username: string, password: string) {
    try {
      // In a real app, this would be a POST request to an authentication endpoint
      const response = await axios.get('http://localhost:3001/users', {
        params: { username, password }
      })

      if (response.data.length > 0) {
        const userData = response.data[0]
        user.value = {
          id: userData.id,
          username: userData.username,
          name: userData.name,
          email: userData.email,
          company: userData.company,
          role: userData.role,
          lastLogin: new Date().toISOString()
        }
        localStorage.setItem('user', JSON.stringify(user.value))
        error.value = ''
        return true
      } else {
        error.value = 'Invalid username or password'
        return false
      }
    } catch (err) {
      error.value = 'An error occurred during login'
      return false
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('user')
  }

  return { user, error, login, logout }
})
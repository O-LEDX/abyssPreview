import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@/types/type'
import { digestPassword, login, logout } from '@/api/apis'
import router from '@/router/index'
import { validateToken } from '@/api/apis'
import { ApiError } from '@/class/ApiError'
import { clearValidTokenCache } from '@/static/authValid'

type Session = { token: string; user: User }


function readSession(): Session | null {
  try {
    return JSON.parse(localStorage.getItem('abyss-session') || 'null') as Session | null
  } catch {
    return null
  }
}
const saved = readSession()

export const useAuthStore = defineStore('auth', () => {
    const token = ref(saved?.token || '')
    const user = ref<User | null>(saved?.user || null)
    const isLoggedIn = computed(() => Boolean(token.value && user.value))

    async function signIn(username: string, password: string) {
      try {
        const data = await login(username, await digestPassword(password))
        token.value = data.token
        user.value = data.user
        localStorage.setItem('abyss-session', JSON.stringify({ token: token.value, user: user.value }))
      } catch (error) {
        throw new ApiError('signIn层失败', 'signIn')
      }
    }
    async function signOut() {
      try {
        await logout()
        token.value = ''
        user.value = null
        localStorage.removeItem('abyss-session')
        clearValidTokenCache()
        router.push({ name: 'login' })
      } catch (error) {
        throw error;
      }
    }
    async function validToken() {
      try {
        await validateToken(headers())
      } catch (error) {
        throw new ApiError('validToken层失败', 'validToken')
      }
      return true
    }
    function headers() {
      return { 'X-Auth-Token': token.value }
    }
    return { token, user, isLoggedIn, signIn, signOut, headers, validToken  }
  })

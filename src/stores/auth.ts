import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 认证状态管理 Store
 * 负责 Token 的读写和登录态判断
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(uni.getStorageSync('token') || null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)

  // Actions
  /**
   * 设置 Token 并持久化
   */
  function setToken(value: string) {
    token.value = value
    uni.setStorageSync('token', value)
  }

  /**
   * 登出：清除内存和持久化 Token
   */
  function logout() {
    token.value = null
    uni.removeStorageSync('token')
  }

  return { token, isLoggedIn, setToken, logout }
})

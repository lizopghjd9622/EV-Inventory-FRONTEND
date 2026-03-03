import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('setToken', () => {
    it('setToken 后 isLoggedIn 应为 true', () => {
      // Given
      const store = useAuthStore()
      expect(store.isLoggedIn).toBe(false)

      // When
      store.setToken('test-token-123')

      // Then
      expect(store.isLoggedIn).toBe(true)
    })

    it('setToken 后应持久化到 uni.setStorageSync', () => {
      // Given
      const store = useAuthStore()

      // When
      store.setToken('test-token-abc')

      // Then
      expect(uni.setStorageSync).toHaveBeenCalledWith('token', 'test-token-abc')
    })

    it('setToken 后 token 值应正确', () => {
      // Given
      const store = useAuthStore()

      // When
      store.setToken('my-token')

      // Then
      expect(store.token).toBe('my-token')
    })
  })

  describe('logout', () => {
    it('logout 后 isLoggedIn 应为 false', () => {
      // Given
      const store = useAuthStore()
      store.setToken('some-token')
      expect(store.isLoggedIn).toBe(true)

      // When
      store.logout()

      // Then
      expect(store.isLoggedIn).toBe(false)
    })

    it('logout 后 token 应为 null', () => {
      // Given
      const store = useAuthStore()
      store.setToken('some-token')

      // When
      store.logout()

      // Then
      expect(store.token).toBeNull()
    })

    it('logout 后应清除 uni.removeStorageSync', () => {
      // Given
      const store = useAuthStore()
      store.setToken('some-token')

      // When
      store.logout()

      // Then
      expect(uni.removeStorageSync).toHaveBeenCalledWith('token')
    })
  })

  describe('isLoggedIn 计算属性', () => {
    it('初始状态 isLoggedIn 应为 false', () => {
      // Given
      vi.mocked(uni.getStorageSync).mockReturnValue('')
      const store = useAuthStore()

      // Then
      expect(store.isLoggedIn).toBe(false)
    })

    it('token 非空时 isLoggedIn 应为 true', () => {
      // Given
      const store = useAuthStore()
      store.setToken('valid-token')

      // Then
      expect(store.isLoggedIn).toBe(true)
    })
  })
})

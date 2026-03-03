import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// 动态重新导入 routeGuard（每次测试前重置 store 状态）
async function getRequireAuth() {
  const { requireAuth } = await import('@/utils/routeGuard')
  return requireAuth
}

describe('requireAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // 重置模块缓存，确保函数拿到最新 store 实例
    vi.resetModules()
  })

  it('已登录时 uni.reLaunch 不应被调用', async () => {
    // Given
    const store = useAuthStore()
    store.setToken('valid-token')
    const requireAuth = await getRequireAuth()

    // When
    requireAuth()

    // Then
    expect(uni.reLaunch).not.toHaveBeenCalled()
  })

  it('未登录时 uni.reLaunch 应跳转到登录页', async () => {
    // Given：store 中无 token（初始状态）
    const requireAuth = await getRequireAuth()

    // When
    requireAuth()

    // Then
    expect(uni.reLaunch).toHaveBeenCalledWith({ url: '/pages/login/index' })
  })
})

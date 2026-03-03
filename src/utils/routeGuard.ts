import { useAuthStore } from '@/stores/auth'

/**
 * 路由守卫：检查用户是否已登录
 * 未登录时自动跳转到登录页
 */
export function requireAuth(): void {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
  }
}

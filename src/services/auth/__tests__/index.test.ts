import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock luch-request
vi.mock('@/utils/request', () => ({
  default: {
    post: vi.fn(),
  },
}))

import http from '@/utils/request'
import { login } from '@/services/auth'

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('login 应以正确参数调用 POST /auth/login', async () => {
      // Given
      const mockResponse = {
        data: { token: 'returned-token', expires_at: '2026-12-31T00:00:00Z' },
        statusCode: 200,
      }
      vi.mocked(http.post).mockResolvedValue(mockResponse)

      // When
      const result = await login({ phone: '13800000001', password: 'secret123' })

      // Then：验证请求参数和路径
      expect(http.post).toHaveBeenCalledWith('/auth/login', {
        phone: '13800000001',
        password: 'secret123',
      })
      expect(result.token).toBe('returned-token')
    })

    it('login 携带验证码时应传入 captcha 字段', async () => {
      // Given
      const mockResponse = {
        data: { token: 'token-xyz', expires_at: '2026-12-31T00:00:00Z' },
        statusCode: 200,
      }
      vi.mocked(http.post).mockResolvedValue(mockResponse)

      // When
      await login({ phone: '13900000002', password: 'pass456', captcha: 'AB12' })

      // Then
      expect(http.post).toHaveBeenCalledWith('/auth/login', {
        phone: '13900000002',
        password: 'pass456',
        captcha: 'AB12',
      })
    })

    it('请求失败时应向上抛出错误', async () => {
      // Given
      vi.mocked(http.post).mockRejectedValue({ statusCode: 401, data: { detail: 'Unauthorized' } })

      // When & Then
      await expect(login({ phone: '13800000001', password: 'wrong' })).rejects.toBeDefined()
    })
  })
})

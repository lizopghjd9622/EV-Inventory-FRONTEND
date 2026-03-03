import http from '@/utils/request'
import type { LoginRequest, LoginResponse } from '@/types/api/auth'

/**
 * 用户登录接口
 * @param data - 登录请求参数（手机号、密码、可选验证码）
 * @returns 包含 token 和过期时间的响应
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await http.post<LoginResponse>('/auth/login', data)
  return response.data
}

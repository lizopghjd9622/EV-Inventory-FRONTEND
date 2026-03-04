/** 登录请求体 */
export interface LoginRequest {
  phone: string
  password: string
  captcha?: string
}

/** 登录响应体 */
export interface LoginResponse {
  access_token: string
  token_type: string
}

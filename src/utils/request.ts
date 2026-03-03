import Request from 'luch-request'

/**
 * 初始化全局 HTTP 请求实例
 * 自动注入 Bearer Token，统一处理 401 跳转和网络异常提示
 */
const http = new Request({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  timeout: 10000,
})

/* 请求拦截器：注入 Bearer Token */
http.interceptors.request.use((config) => {
  // 避免循环引用：在拦截器内部动态导入
  const token = uni.getStorageSync('token') as string
  if (token) {
    config.header = {
      ...config.header,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
})

/* 响应拦截器：处理业务错误 */
http.interceptors.response.use(
  (response) => response,
  (error: { statusCode?: number; errMsg?: string }) => {
    const statusCode = error?.statusCode

    if (statusCode === 401) {
      // 清除 token 并跳转登录页
      uni.removeStorageSync('token')
      uni.reLaunch({ url: '/pages/login/index' })
      return Promise.reject(error)
    }

    if (statusCode === 0 || error?.errMsg?.includes('timeout')) {
      uni.showToast({
        title: '网络异常，请检查连接后重试',
        icon: 'none',
        duration: 2000,
      })
    }

    return Promise.reject(error)
  },
)

export default http

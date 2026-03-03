import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// 注册 uni-app 原生组件为 HTML 等价 stub（测试环境兼容）
config.global.stubs = {
  view: { template: '<div><slot /></div>' },
  text: { template: '<span><slot /></span>' },
  button: { template: '<button v-bind="$attrs"><slot /></button>' },
  image: { template: '<img v-bind="$attrs" />' },
  'scroll-view': { template: '<div><slot /></div>' },
  'swiper': { template: '<div><slot /></div>' },
  'swiper-item': { template: '<div><slot /></div>' },
}


// Mock uni 全局对象（小程序 API）
const mockUni = {
  navigateTo: vi.fn(),
  reLaunch: vi.fn(),
  redirectTo: vi.fn(),
  navigateBack: vi.fn(),
  showToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showModal: vi.fn(),
  getStorageSync: vi.fn(() => ''),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  getRecorderManager: vi.fn(() => {
    // 模拟具有真实回调机制的录音管理器
    let stopCallback: ((res: { tempFilePath: string }) => void) | undefined
    let startCallback: (() => void) | undefined
    return {
      start: vi.fn(() => {
        startCallback?.()
      }),
      stop: vi.fn(() => {
        // 同步触发 onStop 回调（兼容 vi.useFakeTimers 测试环境）
        stopCallback?.({ tempFilePath: 'mock://audio.mp3' })
      }),
      onStart: vi.fn((cb: () => void) => {
        startCallback = cb
      }),
      onStop: vi.fn((cb: (res: { tempFilePath: string }) => void) => {
        stopCallback = cb
      }),
      onError: vi.fn(),
    }
  }),
}

vi.stubGlobal('uni', mockUni)

// 每个测试后重置所有 mock
afterEach(() => {
  vi.clearAllMocks()
})


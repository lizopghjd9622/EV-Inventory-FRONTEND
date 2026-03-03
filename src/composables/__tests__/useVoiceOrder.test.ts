import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVoiceOrderStore } from '@/stores/voiceOrder'
import { OrderType, RecordStatus, SseEventType } from '@/constants'

// Mock streamUploadAudio
vi.mock('@/platform/h5/streamRequest', () => ({
  streamUploadAudio: vi.fn(),
}))

import { streamUploadAudio } from '@/platform/h5/streamRequest'
import { useVoiceOrder } from '@/composables/useVoiceOrder'

describe('useVoiceOrder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('startVoiceOrder', () => {
    it('调用 startVoiceOrder 后 store status 应变为 Streaming', async () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      const blob = new Blob(['audio'], { type: 'audio/wav' })

      // streamUploadAudio 模拟立即完成
      vi.mocked(streamUploadAudio).mockResolvedValue(undefined)

      const { startVoiceOrder } = useVoiceOrder()

      // When
      const promise = startVoiceOrder(blob)

      // Then：启动后立即变为 Streaming
      expect(store.status).toBe(RecordStatus.Streaming)

      await promise
    })

    it('extracted 事件应追加条目到 store.items（含 clientId）', async () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      const blob = new Blob(['audio'], { type: 'audio/wav' })

      vi.mocked(streamUploadAudio).mockImplementation(async (_blob, _orderType, handlers) => {
        handlers.onEvent(SseEventType.EXTRACTED, { name: '苹果', quantity: 2, unit: '箱' })
      })

      const { startVoiceOrder } = useVoiceOrder()

      // When
      await startVoiceOrder(blob)

      // Then：条目已追加，且 clientId 非空
      expect(store.items).toHaveLength(1)
      expect(store.items[0].name).toBe('苹果')
      expect(store.items[0].clientId).toBeTruthy()
    })

    it('order_created 事件应调用 store.setOrderId', async () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      const blob = new Blob(['audio'], { type: 'audio/wav' })

      vi.mocked(streamUploadAudio).mockImplementation(async (_blob, _orderType, handlers) => {
        handlers.onEvent(SseEventType.ORDER_CREATED, { order_id: 99 })
      })

      const { startVoiceOrder } = useVoiceOrder()

      // When
      await startVoiceOrder(blob)

      // Then
      expect(store.orderId).toBe(99)
      expect(store.status).toBe(RecordStatus.Done)
    })

    it('error 事件应调用 store.setError', async () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      const blob = new Blob(['audio'], { type: 'audio/wav' })

      vi.mocked(streamUploadAudio).mockImplementation(async (_blob, _orderType, handlers) => {
        handlers.onEvent(SseEventType.ERROR, { message: '识别失败' })
      })

      const { startVoiceOrder } = useVoiceOrder()

      // When
      await startVoiceOrder(blob)

      // Then
      expect(store.status).toBe(RecordStatus.Error)
      expect(store.errorMessage).toBe('识别失败')
    })

    it('fetch 抛出非 AbortError 应调用 store.setError', async () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      const blob = new Blob(['audio'], { type: 'audio/wav' })

      vi.mocked(streamUploadAudio).mockRejectedValue(new Error('网络错误'))

      const { startVoiceOrder } = useVoiceOrder()

      // When
      await startVoiceOrder(blob)

      // Then
      expect(store.status).toBe(RecordStatus.Error)
    })

    it('cancel 后 AbortError 不应触发 store.setError', async () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      const blob = new Blob(['audio'], { type: 'audio/wav' })

      vi.mocked(streamUploadAudio).mockRejectedValue(new DOMException('Aborted', 'AbortError'))

      const { startVoiceOrder } = useVoiceOrder()

      // When
      await startVoiceOrder(blob)

      // Then：AbortError 不触发错误
      expect(store.status).not.toBe(RecordStatus.Error)
    })
  })
})

/**
 * US3 — 语音录单进货路径验证
 * 复用 US2 测试逻辑，将 orderType 替换为 PURCHASE，
 * 验证 streamUploadAudio 以 PURCHASE 类型调用，SSE 流程完全复用。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVoiceOrderStore } from '@/stores/voiceOrder'
import { OrderType, RecordStatus, SseEventType } from '@/constants'

vi.mock('@/platform/h5/streamRequest', () => ({
  streamUploadAudio: vi.fn(),
}))

import { streamUploadAudio } from '@/platform/h5/streamRequest'
import { useVoiceOrder } from '@/composables/useVoiceOrder'

describe('useVoiceOrder — PURCHASE 路径（US3）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('调用 startVoiceOrder 后 store.orderType 应为 PURCHASE', async () => {
    // Given
    const store = useVoiceOrderStore()
    store.initSession(OrderType.PURCHASE)
    const blob = new Blob(['audio'], { type: 'audio/wav' })
    vi.mocked(streamUploadAudio).mockResolvedValue(undefined)

    const { startVoiceOrder } = useVoiceOrder()

    // When
    await startVoiceOrder(blob)

    // Then
    expect(store.orderType).toBe(OrderType.PURCHASE)
  })

  it('streamUploadAudio 应以 PURCHASE orderType 调用', async () => {
    // Given
    const store = useVoiceOrderStore()
    store.initSession(OrderType.PURCHASE)
    const blob = new Blob(['audio'], { type: 'audio/wav' })
    vi.mocked(streamUploadAudio).mockResolvedValue(undefined)

    const { startVoiceOrder } = useVoiceOrder()

    // When
    await startVoiceOrder(blob)

    // Then: 第二个参数是 PURCHASE
    expect(vi.mocked(streamUploadAudio)).toHaveBeenCalledWith(
      blob,
      OrderType.PURCHASE,
      expect.any(Object),
      expect.any(AbortSignal),
    )
  })

  it('extracted 事件在进货路径下同样追加条目', async () => {
    // Given
    const store = useVoiceOrderStore()
    store.initSession(OrderType.PURCHASE)
    const blob = new Blob(['audio'], { type: 'audio/wav' })

    vi.mocked(streamUploadAudio).mockImplementation(async (_blob, _orderType, handlers) => {
      handlers.onEvent(SseEventType.EXTRACTED, { name: '大米', quantity: 10, unit: '袋' })
    })

    const { startVoiceOrder } = useVoiceOrder()

    // When
    await startVoiceOrder(blob)

    // Then
    expect(store.items).toHaveLength(1)
    expect(store.items[0].name).toBe('大米')
    expect(store.items[0].clientId).toBeTruthy()
  })

  it('order_created 事件在进货路径下同样设置 orderId', async () => {
    // Given
    const store = useVoiceOrderStore()
    store.initSession(OrderType.PURCHASE)
    const blob = new Blob(['audio'], { type: 'audio/wav' })

    vi.mocked(streamUploadAudio).mockImplementation(async (_blob, _orderType, handlers) => {
      handlers.onEvent(SseEventType.ORDER_CREATED, { order_id: 42 })
    })

    const { startVoiceOrder } = useVoiceOrder()

    // When
    await startVoiceOrder(blob)

    // Then
    expect(store.orderId).toBe(42)
    expect(store.status).toBe(RecordStatus.Done)
  })
})

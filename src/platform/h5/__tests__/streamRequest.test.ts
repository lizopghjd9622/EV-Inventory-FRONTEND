import { describe, it, expect, vi, beforeEach } from 'vitest'
import { streamUploadAudio } from '@/platform/h5/streamRequest'
import { OrderType, SseEventType } from '@/constants'

/**
 * 辅助函数：构造 SSE 格式的 ReadableStream
 */
function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
}

describe('streamUploadAudio (H5)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('HTTP 非 200 时应抛出 Error', async () => {
    // Given
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 400, statusText: 'Bad Request' }),
    )
    const blob = new Blob(['audio'], { type: 'audio/wav' })

    // When & Then
    await expect(
      streamUploadAudio(blob, OrderType.SALES, { onEvent: vi.fn(), onDone: vi.fn() }),
    ).rejects.toThrow()
  })

  it('AbortError 不应触发错误回调', async () => {
    // Given
    const abortError = new DOMException('Aborted', 'AbortError')
    vi.mocked(fetch).mockRejectedValue(abortError)
    const blob = new Blob(['audio'], { type: 'audio/wav' })
    const onError = vi.fn()

    // When
    await streamUploadAudio(blob, OrderType.SALES, {
      onEvent: vi.fn(),
      onDone: vi.fn(),
      onError,
    })

    // Then：AbortError 不触发 onError
    expect(onError).not.toHaveBeenCalled()
  })

  it('SSE extracted 事件应触发 onEvent 并解析 JSON data', async () => {
    // Given
    const sseChunk = `event: ${SseEventType.EXTRACTED}\ndata: {"name":"苹果","quantity":3,"unit":"箱"}\n\n`
    vi.mocked(fetch).mockResolvedValue(
      new Response(makeStream([sseChunk]), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )
    const blob = new Blob(['audio'], { type: 'audio/wav' })
    const onEvent = vi.fn()

    // When
    await streamUploadAudio(blob, OrderType.SALES, { onEvent, onDone: vi.fn() })

    // Then
    expect(onEvent).toHaveBeenCalledWith(
      SseEventType.EXTRACTED,
      expect.objectContaining({ name: '苹果', quantity: 3, unit: '箱' }),
    )
  })

  it('order_created 事件应能正确解析', async () => {
    // Given
    const sseChunk = `event: ${SseEventType.ORDER_CREATED}\ndata: {"order_id":42}\n\n`
    vi.mocked(fetch).mockResolvedValue(
      new Response(makeStream([sseChunk]), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )
    const blob = new Blob(['audio'], { type: 'audio/wav' })
    const onEvent = vi.fn()

    // When
    await streamUploadAudio(blob, OrderType.SALES, { onEvent, onDone: vi.fn() })

    // Then
    expect(onEvent).toHaveBeenCalledWith(
      SseEventType.ORDER_CREATED,
      expect.objectContaining({ order_id: 42 }),
    )
  })

  it('onDone 应在流结束后被调用', async () => {
    // Given
    vi.mocked(fetch).mockResolvedValue(
      new Response(makeStream([]), {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )
    const blob = new Blob(['audio'], { type: 'audio/wav' })
    const onDone = vi.fn()

    // When
    await streamUploadAudio(blob, OrderType.SALES, { onEvent: vi.fn(), onDone })

    // Then
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})

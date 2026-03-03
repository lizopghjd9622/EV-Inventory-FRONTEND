import { OrderType, SseEventType } from '@/constants'
import type { SseExtractedPayload, SseOrderCreatedPayload, SseErrorPayload } from '@/types/api/order'

type SsePayload = SseExtractedPayload | SseOrderCreatedPayload | SseErrorPayload

interface StreamHandlers {
  onEvent: (eventType: SseEventType, data: SsePayload) => void
  onDone: () => void
  onError?: (err: Error) => void
}

/**
 * 解析 SSE 数据块（与 H5 端共用同一纯函数逻辑）
 * 将 `event: xxx\ndata: {...}\n\n` 格式解析为事件列表
 */
function parseSseChunk(chunk: string): Array<{ eventType: string; data: unknown }> {
  const results: Array<{ eventType: string; data: unknown }> = []
  const events = chunk.split('\n\n')
  for (const event of events) {
    if (!event.trim()) continue

    let eventType = ''
    let dataStr = ''

    for (const line of event.split('\n')) {
      if (line.startsWith('event:')) {
        eventType = line.slice('event:'.length).trim()
      } else if (line.startsWith('data:')) {
        dataStr = line.slice('data:'.length).trim()
      }
    }

    if (eventType && dataStr) {
      try {
        results.push({ eventType, data: JSON.parse(dataStr) })
      } catch {
        // 忽略 JSON 解析失败
      }
    }
  }
  return results
}

/**
 * 微信小程序端流式上传音频
 * 使用 wx.uploadFile + enableChunked + onChunkReceived 接收 SSE 流
 *
 * @param filePath - 本地录音文件路径（tempFilePath）
 * @param orderType - 订单类型
 * @param handlers - 事件回调
 */
export function streamUploadAudioMp(
  filePath: string,
  orderType: OrderType,
  handlers: StreamHandlers,
): void {
  const { onEvent, onDone, onError } = handlers
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

  let buffer = ''

  function handleChunkData(data: string): void {
    buffer += data

    const lastSeparator = buffer.lastIndexOf('\n\n')
    if (lastSeparator !== -1) {
      const processable = buffer.slice(0, lastSeparator + 2)
      buffer = buffer.slice(lastSeparator + 2)

      const events = parseSseChunk(processable)
      for (const { eventType, data: eventData } of events) {
        if (Object.values(SseEventType).includes(eventType as SseEventType)) {
          onEvent(eventType as SseEventType, eventData as SsePayload)
        }
      }
    }
  }

  const uploadTask = wx.uploadFile({
    url: `${baseUrl}/orders/voice-extract?order_type=${orderType}`,
    filePath,
    name: 'file',
    enableChunked: true,
    success(res) {
      if (res.statusCode >= 400) {
        onError?.(new Error(`HTTP ${res.statusCode}`))
        return
      }
      // 处理剩余缓冲
      if (buffer.trim()) {
        const events = parseSseChunk(buffer)
        for (const { eventType, data } of events) {
          if (Object.values(SseEventType).includes(eventType as SseEventType)) {
            onEvent(eventType as SseEventType, data as SsePayload)
          }
        }
      }
      onDone()
    },
    fail(err) {
      onError?.(new Error(err.errMsg))
    },
  })

  uploadTask.onChunkReceived((res) => {
    const decoder = new TextDecoder('utf-8')
    const text = decoder.decode(new Uint8Array(res.data))
    handleChunkData(text)
  })
}

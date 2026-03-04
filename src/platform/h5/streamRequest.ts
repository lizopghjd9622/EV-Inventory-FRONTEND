import { OrderType, SseEventType } from '@/constants'
import type { SseExtractedPayload, SseOrderCreatedPayload, SseErrorPayload } from '@/types/api/order'

type SsePayload = SseExtractedPayload | SseOrderCreatedPayload | SseErrorPayload

interface StreamHandlers {
  onEvent: (eventType: SseEventType, data: SsePayload) => void
  onDone: () => void
  onError?: (err: Error) => void
}

/**
 * 解析单个 SSE 数据块，提取 event 和 data 字段
 * 支持 `event: xxx\ndata: {...}\n\n` 格式
 */
function parseSseChunk(chunk: string): Array<{ eventType: string; data: unknown }> {
  const results: Array<{ eventType: string; data: unknown }> = []
  // 按双换行分割事件块
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
 * H5 端流式上传音频，通过 Fetch + ReadableStream 读取 SSE 事件
 *
 * @param blob - 录音 Blob
 * @param orderType - 订单类型（SALES / PURCHASE）
 * @param handlers - 事件回调
 * @param signal - 可选的 AbortSignal，用于取消请求
 */
export async function streamUploadAudio(
  blob: Blob,
  orderType: OrderType,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const { onEvent, onDone, onError } = handlers
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

  // 根据 Blob 的实际 MIME type 推断文件扩展名
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'mp4',
    'audio/wav': 'wav',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
  }
  const baseMime = blob.type.split(';')[0].trim()
  const ext = mimeToExt[baseMime] ?? 'webm'
  const filename = `audio.${ext}`

  const formData = new FormData()
  formData.append('file', blob, filename)

  const url = `${baseUrl}/voice/orders?order_type=${orderType}`

  // 从持久化存储读取 token，注入 Authorization 头
  const token = uni.getStorageSync('token') as string | undefined
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal,
    })
  } catch (err) {
    // AbortError 静默忽略
    if (err instanceof DOMException && err.name === 'AbortError') {
      return
    }
    onError?.(err instanceof Error ? err : new Error(String(err)))
    return
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onDone()
    return
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 处理缓冲区中已完整的 SSE 事件（以 \n\n 结尾）
      const lastSeparator = buffer.lastIndexOf('\n\n')
      if (lastSeparator !== -1) {
        const processable = buffer.slice(0, lastSeparator + 2)
        buffer = buffer.slice(lastSeparator + 2)

        const events = parseSseChunk(processable)
        for (const { eventType, data } of events) {
          if (Object.values(SseEventType).includes(eventType as SseEventType)) {
            onEvent(eventType as SseEventType, data as SsePayload)
          }
        }
      }
    }

    // 处理剩余缓冲区
    if (buffer.trim()) {
      const events = parseSseChunk(buffer)
      for (const { eventType, data } of events) {
        if (Object.values(SseEventType).includes(eventType as SseEventType)) {
          onEvent(eventType as SseEventType, data as SsePayload)
        }
      }
    }
  } finally {
    reader.releaseLock()
    onDone()
  }
}

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

  // 录音文件路径为空时快速失败，避免 wx.uploadFile 收到 undefined 后行为不可预期
  if (!filePath) {
    console.error('[streamUploadAudioMp] filePath 为空，无法上传')
    onError?.(new Error('无法获取录音临时路径'))
    onDone()
    return
  }

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

  const uploadUrl = `${baseUrl}/voice/orders?order_type=${orderType}`
  console.log('[streamUploadAudioMp] 开始上传，URL:', uploadUrl)

  const uploadTask = wx.uploadFile({
    url: uploadUrl,
    filePath,
    name: 'file',
    header: {
      Authorization: `Bearer ${uni.getStorageSync('token') ?? ''}`,
    },
    enableChunked: true,
    success(res) {
      console.log('[streamUploadAudioMp] success statusCode:', res.statusCode, 'buffer长度:', buffer.length)
      // 3xx 重定向：微信跟随重定向后改用 GET，SSE 数据不会到达
      // 需要在服务端把 301/302 改为 307/308 以保留 POST 方法
      if (res.statusCode >= 300 && res.statusCode < 400) {
        console.error('[streamUploadAudioMp] 检测到重定向(', res.statusCode, ')，POST 被改成 GET，SSE 数据丢失。请将服务端重定向改为 307/308。')
        onError?.(new Error(`服务端重定向 (${res.statusCode})，请联系后端修改为 307 永久重定向`))
        onDone()
        return
      }
      if (res.statusCode >= 400) {
        console.error('[streamUploadAudioMp] HTTP 错误:', res.statusCode)
        onError?.(new Error(`HTTP ${res.statusCode}`))
        onDone()
        return
      }
      // 若 onChunkReceived 已触发，buffer 中保留末尾未结束片段
      // 若 onChunkReceived 未触发（基础库不支持 uploadFile enableChunked），
      // 全量数据在 res.data，此时 buffer 为空，从 res.data 兜底解析
      const toProcess = buffer || (typeof res?.data === 'string' ? res.data : '')
      if (toProcess.trim()) {
        const events = parseSseChunk(toProcess)
        for (const { eventType, data } of events) {
          if (Object.values(SseEventType).includes(eventType as SseEventType)) {
            onEvent(eventType as SseEventType, data as SsePayload)
          }
        }
      }
      onDone()
    },
    fail(err) {
      console.error('[streamUploadAudioMp] fail:', err.errMsg)
      onError?.(new Error(err.errMsg))
    },
  })

  uploadTask.onChunkReceived((res) => {
    const decoder = new TextDecoder('utf-8')
    const text = decoder.decode(new Uint8Array(res.data))
    console.log('[streamUploadAudioMp] onChunkReceived, 长度:', res.data.byteLength, '内容前100字符:', text.slice(0, 100))
    handleChunkData(text)
  })
}

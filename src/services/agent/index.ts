import { AgentEventType } from '@/constants'

export interface AgentEventHandlers {
  onTranscribed?: (text: string) => void
  onThinking?: (text: string) => void
  onAnswer?: (text: string) => void
  onError?: (msg: string) => void
  onDone?: () => void
}

interface AgentEventData {
  content?: string
  text?: string
  message?: string
  transcript?: string
  [key: string]: unknown
}

function parseSseChunk(chunk: string): Array<{ eventType: string; data: AgentEventData }> {
  const results: Array<{ eventType: string; data: AgentEventData }> = []
  const events = chunk.split('\n\n')
  for (const event of events) {
    if (!event.trim()) continue
    let eventType = ''
    let dataStr = ''
    for (const line of event.split('\n')) {
      if (line.startsWith('event:')) eventType = line.slice(6).trim()
      else if (line.startsWith('data:')) dataStr = line.slice(5).trim()
    }
    if (eventType && dataStr) {
      try {
        results.push({ eventType, data: JSON.parse(dataStr) as AgentEventData })
      } catch {
        // ignore
      }
    }
  }
  return results
}

function extractText(data: AgentEventData): string {
  return (data.content ?? data.transcript ?? data.text ?? data.message ?? '') as string
}

declare const wx: any

async function streamAgentMp(
  url: string,
  method: 'GET' | 'POST',
  header: any,
  data: any,
  handlers: AgentEventHandlers,
  isUpload: boolean = false,
  filePath?: string,
): Promise<void> {
  const { onDone, onError } = handlers
  let buffer = ''

  const handleChunk = (res: { data: ArrayBuffer }) => {
    // 微信小程序 onChunkReceived 返回的是 ArrayBuffer
    let text = ''
    if (typeof TextDecoder !== 'undefined') {
      text = new TextDecoder('utf-8').decode(res.data, { stream: true })
    } else {
      // 简易 fallback
      const uint8 = new Uint8Array(res.data)
      let str = ''
      for (let i = 0; i < uint8.length; i++) {
        str += String.fromCharCode(uint8[i])
      }
      try {
        text = decodeURIComponent(escape(str))
      } catch {
        text = str
      }
    }

    buffer += text
    const lastSep = buffer.lastIndexOf('\n\n')
    if (lastSep !== -1) {
      const processable = buffer.slice(0, lastSep + 2)
      buffer = buffer.slice(lastSep + 2)
      for (const { eventType, data } of parseSseChunk(processable)) {
        dispatchEvent(eventType as AgentEventType, data, handlers)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let task: any

  if (isUpload && filePath) {
    task = wx.uploadFile({
      url,
      filePath,
      name: 'file',
      header,
      formData: data || {},
      enableChunked: true,
      success: () => {
        // 请求完成，处理剩余 buffer
        if (buffer.trim()) {
           for (const { eventType, data } of parseSseChunk(buffer)) {
             dispatchEvent(eventType as AgentEventType, data, handlers)
           }
        }
        onDone?.()
      },
      fail: (err: any) => {
        onError?.(err?.errMsg || 'Upload Failed')
        onDone?.()
      },
    })
  } else {
    task = wx.request({
      url,
      method,
      header,
      data,
      enableChunked: true,
      responseType: 'arraybuffer',
      success: () => {
        // 请求完成，处理剩余 buffer
        if (buffer.trim()) {
           for (const { eventType, data } of parseSseChunk(buffer)) {
             dispatchEvent(eventType as AgentEventType, data, handlers)
           }
        }
        onDone?.()
      },
      fail: (err: any) => {
        onError?.(err?.errMsg || 'Request Failed')
        onDone?.()
      },
    })
  }

  if (task && task.onChunkReceived) {
    task.onChunkReceived(handleChunk)
  }
}

async function streamAgent(
  url: string,
  init: RequestInit,
  handlers: AgentEventHandlers,
): Promise<void> {
  const { onTranscribed, onThinking, onAnswer, onError, onDone } = handlers

  // 平台检测：如果是小程序环境且没有 fetch
  if (typeof fetch === 'undefined' && typeof wx !== 'undefined') {
    const method = (init.method || 'GET') as 'GET' | 'POST'
    const headers = (init.headers || {}) as any
    const body = init.body

    // 简单体：如果是字符串，则解析为 JSON 对象传给 wx.request
    let data = body
    if (typeof body === 'string') {
      try {
        data = JSON.parse(body)
      } catch {
        // ignore
      }
    }

    return streamAgentMp(url, method, headers, data, handlers)
  }

  // H5 / 标准 Web 环境
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (err) {
    onError?.(err instanceof Error ? err.message : '网络请求失败')
    onDone?.()
    return
  }

  if (!response.ok) {
    if (response.status === 401) {
      uni.removeStorageSync('token')
      uni.redirectTo({ url: '/pages/login/index' })
      return
    }
    onError?.(`请求失败 (${response.status})`)
    onDone?.()
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onDone?.()
    return
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lastSep = buffer.lastIndexOf('\n\n')
      if (lastSep !== -1) {
        const processable = buffer.slice(0, lastSep + 2)
        buffer = buffer.slice(lastSep + 2)
        for (const { eventType, data } of parseSseChunk(processable)) {
          dispatchEvent(eventType as AgentEventType, data, handlers)
        }
      }
    }
    if (buffer.trim()) {
      for (const { eventType, data } of parseSseChunk(buffer)) {
        dispatchEvent(eventType as AgentEventType, data, handlers)
      }
    }
  } finally {
    reader.releaseLock()
    onDone?.()
  }
}

function dispatchEvent(
  eventType: AgentEventType,
  data: AgentEventData,
  handlers: AgentEventHandlers,
) {
  switch (eventType) {
    case AgentEventType.TRANSCRIBED:
      handlers.onTranscribed?.(extractText(data))
      break
    case AgentEventType.THINKING:
      handlers.onThinking?.(extractText(data))
      break
    case AgentEventType.ANSWER:
      handlers.onAnswer?.(extractText(data))
      break
    case AgentEventType.ERROR:
      handlers.onError?.(extractText(data) || '查询出错，请重试')
      break
    // tool_call / tool_result 暂忽略
  }
}

function buildHeaders(): HeadersInit {
  const token = uni.getStorageSync('token') as string | undefined
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/**
 * 文字查询老板助手
 */
export function agentQueryByText(question: string, handlers: AgentEventHandlers): Promise<void> {
  return streamAgent(
    `${getBaseUrl()}/agent/query`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ question }),
    },
    handlers,
  )
}

/**
 * 语音查询老板助手
 */
export function agentQueryByVoice(blob: Blob, handlers: AgentEventHandlers): Promise<void> {
  // 小程序环境直接使用 uploadFile Stream
  if (typeof wx !== 'undefined' && typeof fetch === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mpBlob = blob as any
    const filePath = mpBlob._mpTempPath
    if (!filePath) {
      handlers.onError?.('无法获取录音临时路径')
      handlers.onDone?.()
      return Promise.resolve()
    }

    const token = uni.getStorageSync('token') as string | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headers: any = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    return streamAgentMp(
      `${getBaseUrl()}/agent/query_by_voice`,
      'POST',
      headers,
      {},
      handlers,
      true,
      filePath,
    )
  }

  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'mp4',
    'audio/wav': 'wav',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
  }
  const ext = mimeToExt[blob.type.split(';')[0].trim()] ?? 'webm'
  const formData = new FormData()
  formData.append('file', blob, `audio.${ext}`)

  const token = uni.getStorageSync('token') as string | undefined
  const headers: HeadersInit = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  return streamAgent(
    `${getBaseUrl()}/agent/query_by_voice`,
    { method: 'POST', headers, body: formData },
    handlers,
  )
}

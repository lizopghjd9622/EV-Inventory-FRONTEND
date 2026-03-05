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
  return (data.content ?? data.text ?? data.message ?? '') as string
}

async function streamAgent(
  url: string,
  init: RequestInit,
  handlers: AgentEventHandlers,
): Promise<void> {
  const { onTranscribed, onThinking, onAnswer, onError, onDone } = handlers

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

import { useVoiceOrderStore } from '@/stores/voiceOrder'
import { OrderType, RecordStatus, SseEventType } from '@/constants'
import { streamUploadAudio } from '@/platform/streamRequest'
import type { SseExtractedPayload } from '@/types/api/order'

/**
 * 生成前端唯一 clientId（不依赖外部库）
 */
function generateClientId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 语音录单流程编排 Composable
 *
 * 负责协调录音上传、SSE 事件分发和 Store 状态更新
 */
export function useVoiceOrder() {
  const store = useVoiceOrderStore()

  let abortController: AbortController | null = null

  /**
   * 开始上传录音并监听 SSE 流式结果
   * @param blob - 录音 Blob
   */
  async function startVoiceOrder(blob: Blob): Promise<void> {
    store.setStatus(RecordStatus.Streaming)
    
    if (typeof AbortController !== 'undefined') {
      abortController = new AbortController()
    } else {
      // 兼容环境（如小程序低版本基础库）缺失 AbortController
      // 提供一个哑对象防止报错，但取消功能会失效
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      abortController = {
        signal: {} as AbortSignal,
        abort: () => { /* no-op */ },
      } as unknown as AbortController
    }

    try {
      await streamUploadAudio(
        blob,
        store.orderType as OrderType,
        {
          onEvent(eventType, data) {
            if (eventType === SseEventType.EXTRACTED) {
              const payload = data as SseExtractedPayload
              const isSales = (payload.order_type ?? store.orderType) === OrderType.SALES
              for (const item of payload.items) {
                const unitPrice = item.unit_price !== undefined ? Number(item.unit_price) : undefined
                store.appendItem({
                  clientId: generateClientId(),
                  name: item.name,
                  quantity: Number(item.quantity),
                  unit: item.unit,
                  price: isSales ? unitPrice : undefined,
                  cost: isSales ? undefined : unitPrice,
                })
              }
            } else if (eventType === SseEventType.ERROR) {
              // 识别失败也跳确认页，让用户手动录入
              store.setStatus(RecordStatus.Done)
            }
          },
          onDone() {
            store.setStatus(RecordStatus.Done)
          },
          onError(_err) {
            // 网络/连接错误也跳确认页，让用户手动录入
            store.setStatus(RecordStatus.Done)
          },
        },
        abortController.signal,
      )
    } catch (err) {
      // AbortError 不触发错误状态 (兼容检测 DOMException 是否存在)
      const isAbort =
        typeof DOMException !== 'undefined' &&
        err instanceof DOMException &&
        err.name === 'AbortError'

      if (isAbort) {
        return
      }
      // 异常也跳确认页，让用户手动录入
      store.setStatus(RecordStatus.Done)
    }
  }

  /**
   * 取消当前流式请求
   */
  function cancel(): void {
    abortController?.abort()
    abortController = null
  }

  return {
    startVoiceOrder,
    cancel,
  }
}

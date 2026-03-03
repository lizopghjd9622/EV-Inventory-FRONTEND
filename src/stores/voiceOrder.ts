import { defineStore } from 'pinia'
import { ref } from 'vue'
import { OrderType, RecordStatus } from '@/constants'
import type { EditableOrderItem, VoiceOrderSession } from '@/types/models/order'

/**
 * 语音录单会话状态管理 Store
 * 管理录音、SSE 流式解析、条目编辑的完整生命周期
 */
export const useVoiceOrderStore = defineStore('voiceOrder', () => {
  // State
  const orderType = ref<VoiceOrderSession['orderType']>(OrderType.SALES)
  const status = ref<RecordStatus>(RecordStatus.Idle)
  const items = ref<EditableOrderItem[]>([])
  const orderId = ref<number | null>(null)
  const audioBlob = ref<Blob | null>(null)
  const errorMessage = ref<string | null>(null)

  // Actions

  /**
   * 初始化新的录音会话，重置所有状态
   */
  function initSession(type: OrderType) {
    orderType.value = type
    status.value = RecordStatus.Idle
    items.value = []
    orderId.value = null
    audioBlob.value = null
    errorMessage.value = null
  }

  /**
   * 保存录音 Blob（用于错误时重发）
   */
  function setAudioBlob(blob: Blob) {
    audioBlob.value = blob
  }

  /**
   * 追加 SSE 识别到的条目
   */
  function appendItem(item: EditableOrderItem) {
    items.value.push(item)
  }

  /**
   * 用户编辑条目后更新
   */
  function updateItem(patch: EditableOrderItem) {
    const index = items.value.findIndex((i) => i.clientId === patch.clientId)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...patch }
    }
  }

  /**
   * 删除指定条目
   */
  function deleteItem(clientId: string) {
    items.value = items.value.filter((i) => i.clientId !== clientId)
  }

  /**
   * 设置错误状态（保留 audioBlob 以便重发）
   */
  function setError(message: string) {
    status.value = RecordStatus.Error
    errorMessage.value = message
  }

  /**
   * 设置订单 ID，状态流转到 Done
   */
  function setOrderId(id: number) {
    orderId.value = id
    status.value = RecordStatus.Done
  }

  /**
   * 设置会话状态
   */
  function setStatus(s: RecordStatus) {
    status.value = s
  }

  return {
    orderType,
    status,
    items,
    orderId,
    audioBlob,
    errorMessage,
    initSession,
    setAudioBlob,
    appendItem,
    updateItem,
    deleteItem,
    setError,
    setOrderId,
    setStatus,
  }
})

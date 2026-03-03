import type { OrderType, RecordStatus } from '@/constants'

/** 可编辑的订单条目（前端业务模型） */
export interface EditableOrderItem {
  /** 前端唯一标识，用于 v-for key 和操作定位 */
  clientId: string
  name: string
  quantity: number
  unit: string
  price?: number
  cost?: number
}

/** 语音录单会话状态（前端业务模型） */
export interface VoiceOrderSession {
  orderType: OrderType
  status: RecordStatus
  items: EditableOrderItem[]
  orderId: number | null
  audioBlob: Blob | null
  errorMessage: string | null
}

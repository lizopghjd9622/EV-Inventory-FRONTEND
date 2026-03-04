/** 销售订单条目 DTO */
export interface SalesItemDto {
  name: string
  quantity: number
  unit: string
  price?: number
}

/** 销售订单 DTO */
export interface SalesOrderDto {
  id: number
  items: SalesItemDto[]
  created_at: string
}

/** 进货订单条目 DTO */
export interface PurchaseItemDto {
  name: string
  quantity: number
  unit: string
  cost?: number
}

/** 进货订单 DTO */
export interface PurchaseOrderDto {
  id: number
  items: PurchaseItemDto[]
  created_at: string
}

/** SSE 提取事件 - 单条目结构（后端实际格式）*/
export interface SseExtractedItem {
  name: string
  quantity: string | number
  unit: string
  unit_price?: string | number
  amount?: string | number
}

/** SSE 提取事件载荷 */
export interface SseExtractedPayload {
  order_type?: string
  items: SseExtractedItem[]
}

/** SSE 订单创建事件载荷 */
export interface SseOrderCreatedPayload {
  order_id: number
}

/** SSE 错误事件载荷 */
export interface SseErrorPayload {
  message: string
  code?: string
}

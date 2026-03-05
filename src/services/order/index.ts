import request from '@/utils/request'

export interface OrderItemRequest {
  name: string
  unit: string
  quantity: number | string
  unit_price: number | string
  amount: number | string
}

export interface CreateAndConfirmOrderRequest {
  items: OrderItemRequest[]
}

/**
 * 创建并确认销售单
 */
export async function createAndConfirmSalesOrder(
  payload: CreateAndConfirmOrderRequest,
): Promise<void> {
  await request.post('/sales-orders/create-and-confirm', payload)
}

/**
 * 创建并确认进货单
 */
export async function createAndConfirmPurchaseOrder(
  payload: CreateAndConfirmOrderRequest,
): Promise<void> {
  await request.post('/purchase-orders/create-and-confirm', payload)
}

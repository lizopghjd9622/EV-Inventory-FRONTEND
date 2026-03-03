import request from '@/utils/request'

/**
 * 确认销售订单
 * @param id 订单 ID
 */
export async function confirmSalesOrder(id: number): Promise<void> {
  await request.post(`/orders/sales/${id}/confirm`)
}

/**
 * 确认进货订单
 * @param id 订单 ID
 */
export async function confirmPurchaseOrder(id: number): Promise<void> {
  await request.post(`/orders/purchase/${id}/confirm`)
}

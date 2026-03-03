import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StreamingItemList from '@/components/business/StreamingItemList.vue'
import type { EditableOrderItem } from '@/types/models/order'

const mockItems: EditableOrderItem[] = [
  { clientId: 'c1', name: '苹果', quantity: 2, unit: '箱' },
  { clientId: 'c2', name: '橙子', quantity: 5, unit: '个' },
]

describe('StreamingItemList', () => {
  it('streaming=true 时应渲染骨架屏', () => {
    // Given & When
    const wrapper = mount(StreamingItemList, {
      props: { streaming: true, items: [] },
    })

    // Then：存在骨架屏元素（loading-row）
    expect(wrapper.find('[data-testid="loading-row"]').exists()).toBe(true)
  })

  it('streaming=false + items 非空时应渲染对应数量的 OrderItemRow', () => {
    // Given & When
    const wrapper = mount(StreamingItemList, {
      props: { streaming: false, items: mockItems },
    })

    // Then
    expect(wrapper.findAll('[data-testid="order-item-row"]')).toHaveLength(2)
  })

  it('streaming=false 时不应渲染骨架屏', () => {
    // Given & When
    const wrapper = mount(StreamingItemList, {
      props: { streaming: false, items: [] },
    })

    // Then
    expect(wrapper.find('[data-testid="loading-row"]').exists()).toBe(false)
  })

  it('items 为空且 streaming=false 时应有空状态提示', () => {
    // Given & When
    const wrapper = mount(StreamingItemList, {
      props: { streaming: false, items: [] },
    })

    // Then
    expect(wrapper.find('[data-testid="empty-hint"]').exists()).toBe(true)
  })
})

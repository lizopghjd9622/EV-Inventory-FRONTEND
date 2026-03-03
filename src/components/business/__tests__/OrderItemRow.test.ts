import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderItemRow from '@/components/business/OrderItemRow.vue'
import type { EditableOrderItem } from '@/types/models/order'

const mockItem: EditableOrderItem = {
  clientId: 'c-001',
  name: '苹果',
  quantity: 3,
  unit: '箱',
}

describe('OrderItemRow', () => {
  it('应渲染 item.name、item.quantity、item.unit', () => {
    // Given & When
    const wrapper = mount(OrderItemRow, {
      props: { item: mockItem },
    })

    // Then：input 的 value 是 DOM property，通过 element.value 断言
    const nameInput = wrapper.find('[data-testid="item-name"]').element as HTMLInputElement
    const qtyInput = wrapper.find('[data-testid="item-quantity"]').element as HTMLInputElement
    const unitInput = wrapper.find('[data-testid="item-unit"]').element as HTMLInputElement

    expect(nameInput.value).toBe('苹果')
    expect(qtyInput.value).toBe('3')
    expect(unitInput.value).toBe('箱')
  })

  it('修改 name 输入框后应 emit update:item 含完整 patch 对象', async () => {
    // Given
    const wrapper = mount(OrderItemRow, {
      props: { item: mockItem },
    })

    // When：触发 input 事件（模拟用户输入）
    const nameInput = wrapper.find('[data-testid="item-name"]')
    await nameInput.setValue('香蕉')

    // Then
    const emitted = wrapper.emitted('update:item')
    expect(emitted).toBeDefined()
    expect(emitted![0][0]).toMatchObject({
      clientId: 'c-001',
      name: '香蕉',
    })
  })

  it('点击删除按钮后应 emit delete 并携带 clientId', async () => {
    // Given
    const wrapper = mount(OrderItemRow, {
      props: { item: mockItem },
    })

    // When
    await wrapper.find('[data-testid="delete-btn"]').trigger('click')

    // Then
    const emitted = wrapper.emitted('delete')
    expect(emitted).toBeDefined()
    expect(emitted![0][0]).toBe('c-001')
  })
})

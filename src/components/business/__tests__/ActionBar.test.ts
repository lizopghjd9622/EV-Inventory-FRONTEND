import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ActionBar from '@/components/business/ActionBar.vue'

describe('ActionBar', () => {
  it('点击「重新录音」按钮应 emit rerecord 事件', async () => {
    // Given
    const wrapper = mount(ActionBar, {
      props: { loading: false },
    })

    // When
    await wrapper.find('[data-testid="rerecord-btn"]').trigger('click')

    // Then
    expect(wrapper.emitted('rerecord')).toBeDefined()
  })

  it('点击「确认提交」按钮应 emit confirm 事件', async () => {
    // Given
    const wrapper = mount(ActionBar, {
      props: { loading: false },
    })

    // When
    await wrapper.find('[data-testid="confirm-btn"]').trigger('click')

    // Then
    expect(wrapper.emitted('confirm')).toBeDefined()
  })

  it('loading=true 时「确认提交」按钮应为 disabled 状态', () => {
    // Given & When
    const wrapper = mount(ActionBar, {
      props: { loading: true },
    })

    // Then
    const confirmBtn = wrapper.find('[data-testid="confirm-btn"]')
    expect(confirmBtn.attributes('disabled')).toBeDefined()
  })

  it('loading=false 时「确认提交」按钮不应为 disabled', () => {
    // Given & When
    const wrapper = mount(ActionBar, {
      props: { loading: false },
    })

    // Then
    const confirmBtn = wrapper.find('[data-testid="confirm-btn"]')
    expect(confirmBtn.attributes('disabled')).toBeUndefined()
  })
})

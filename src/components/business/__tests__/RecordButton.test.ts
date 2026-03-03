import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RecordButton from '../RecordButton.vue'

// ---------- Mock useRecorder ----------
let mockOnTimeout: (() => void) | undefined
const mockStartRecording = vi.fn()
const mockStopRecording = vi.fn()
const mockIsRecording = { value: false }

vi.mock('@/composables/useRecorder', () => ({
  useRecorder: vi.fn((opts?: { onTimeout?: () => void }) => {
    mockOnTimeout = opts?.onTimeout
    return {
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      isRecording: mockIsRecording,
    }
  }),
}))

describe('RecordButton', () => {
  const mockBlob = new Blob(['audio'], { type: 'audio/webm' })

  beforeEach(() => {
    mockStartRecording.mockReset()
    mockStopRecording.mockReset()
    mockIsRecording.value = false
    mockOnTimeout = undefined
    mockStopRecording.mockResolvedValue(mockBlob)
  })

  it('touchstart 触发 emit record-start', async () => {
    // Given: 正常状态的 RecordButton
    const wrapper = mount(RecordButton, { props: { label: '销售' } })

    // When: 触发 touchstart
    await wrapper.find('[data-testid="record-btn"]').trigger('touchstart')

    // Then: startRecording 被调用，emit record-start
    expect(mockStartRecording).toHaveBeenCalledOnce()
    expect(wrapper.emitted('record-start')).toHaveLength(1)
  })

  it('touchend 触发 emit record-stop(blob)', async () => {
    // Given
    const wrapper = mount(RecordButton, { props: { label: '销售' } })

    // When
    await wrapper.find('[data-testid="record-btn"]').trigger('touchend')
    await flushPromises()

    // Then
    expect(mockStopRecording).toHaveBeenCalledOnce()
    expect(wrapper.emitted('record-stop')?.[0]).toEqual([mockBlob])
  })

  it('mousedown/mouseup 同样触发录音（PC 兼容）', async () => {
    // Given
    const wrapper = mount(RecordButton, { props: { label: '销售' } })

    // When
    await wrapper.find('[data-testid="record-btn"]').trigger('mousedown')
    await wrapper.find('[data-testid="record-btn"]').trigger('mouseup')
    await flushPromises()

    // Then
    expect(mockStartRecording).toHaveBeenCalledOnce()
    expect(wrapper.emitted('record-start')).toHaveLength(1)
    expect(wrapper.emitted('record-stop')?.[0]).toEqual([mockBlob])
  })

  it('disabled=true 时 touchstart 不触发录音', async () => {
    // Given: disabled RecordButton
    const wrapper = mount(RecordButton, { props: { label: '销售', disabled: true } })

    // When
    await wrapper.find('[data-testid="record-btn"]').trigger('touchstart')

    // Then: startRecording 不被调用，无 record-start emit
    expect(mockStartRecording).not.toHaveBeenCalled()
    expect(wrapper.emitted('record-start')).toBeUndefined()
  })

  it('60s 超时触发 emit record-timeout', async () => {
    // Given: mount 组件，useRecorder 收到 onTimeout 回调
    const wrapper = mount(RecordButton, { props: { label: '销售' } })
    expect(mockOnTimeout).toBeDefined()

    // When: 模拟超时触发
    mockOnTimeout!()
    await wrapper.vm.$nextTick()

    // Then: emit record-timeout
    expect(wrapper.emitted('record-timeout')).toHaveLength(1)
  })
})

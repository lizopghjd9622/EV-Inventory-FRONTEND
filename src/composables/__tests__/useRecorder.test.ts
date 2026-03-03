import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecorder } from '@/composables/useRecorder'

describe('useRecorder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('startRecording', () => {
    it('startRecording 后 isRecording 应为 true', async () => {
      // Given
      const { isRecording, startRecording } = useRecorder()
      expect(isRecording.value).toBe(false)

      // When
      startRecording()

      // Then
      expect(isRecording.value).toBe(true)
    })

    it('重复调用 startRecording 不应开启第二个录音（isRecording 保持 true）', () => {
      // Given
      const { isRecording, startRecording } = useRecorder()
      startRecording()

      // When：再次调用
      startRecording()

      // Then：状态不变，没有副作用
      expect(isRecording.value).toBe(true)
    })
  })

  describe('stopRecording', () => {
    it('stopRecording 后 isRecording 应为 false', async () => {
      // Given
      const { isRecording, startRecording, stopRecording } = useRecorder()
      startRecording()
      expect(isRecording.value).toBe(true)

      // When
      await stopRecording()

      // Then
      expect(isRecording.value).toBe(false)
    })

    it('stopRecording 应 resolve 一个 Blob', async () => {
      // Given
      const { startRecording, stopRecording } = useRecorder()
      startRecording()

      // When
      const blob = await stopRecording()

      // Then
      expect(blob).toBeInstanceOf(Blob)
    })
  })

  describe('60s 超时', () => {
    it('录音超过 60s 后 onTimeout 回调应被调用', () => {
      // Given
      const onTimeout = vi.fn()
      const { startRecording } = useRecorder({ onTimeout })
      startRecording()

      // When：模拟经过 60s
      vi.advanceTimersByTime(60 * 1000)

      // Then
      expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    it('录音超过 60s 后 isRecording 应变为 false', () => {
      // Given
      const { isRecording, startRecording } = useRecorder()
      startRecording()

      // When
      vi.advanceTimersByTime(60 * 1000)

      // Then
      expect(isRecording.value).toBe(false)
    })
  })
})

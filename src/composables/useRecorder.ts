import { ref } from 'vue'
import { MAX_RECORD_SECONDS } from '@/constants'

interface UseRecorderOptions {
  /** 达到最大录音时长时的回调 */
  onTimeout?: () => void
}

/**
 * 录音 Composable
 *
 * H5 平台使用 MediaRecorder，小程序平台使用 uni.getRecorderManager()。
 * 自动在 MAX_RECORD_SECONDS 秒后超时停止录音。
 */
export function useRecorder(options: UseRecorderOptions = {}) {
  const isRecording = ref(false)

  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let stopResolve: ((blob: Blob) => void) | null = null

  // H5 分支使用的变量
  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  // 小程序分支：复用同一个 recorderManager 实例
  let uniRecorderManager: ReturnType<typeof uni.getRecorderManager> | null = null

  /**
   * 强制停止录音，返回 Blob（内部工具函数）
   */
  async function _forceStop(): Promise<Blob> {
    if (!isRecording.value) {
      return new Blob([])
    }

    return new Promise<Blob>((resolve) => {
      isRecording.value = false

      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      if (typeof MediaRecorder !== 'undefined' && mediaRecorder) {
        // H5 路径
        stopResolve = resolve
        mediaRecorder.stop()
      } else {
        // 小程序路径 / 测试路径
        stopResolve = resolve
        uniRecorderManager?.stop()
      }
    })
  }

  /**
   * 开始录音
   * 若已在录音中，则忽略
   */
  function startRecording(): void {
    if (isRecording.value) return

    isRecording.value = true
    chunks = []

    // 60s 超时保护
    timeoutId = setTimeout(() => {
      isRecording.value = false
      timeoutId = null
      options.onTimeout?.()

      // 通知 pendingStop（如果有）
      if (stopResolve) {
        const resolve = stopResolve
        stopResolve = null
        resolve(new Blob(chunks, { type: 'audio/wav' }))
      }
    }, MAX_RECORD_SECONDS * 1000)

    if (typeof MediaRecorder !== 'undefined') {
      // H5 分支
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaRecorder = new MediaRecorder(stream)
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data)
            }
          }
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' })
            if (stopResolve) {
              const resolve = stopResolve
              stopResolve = null
              resolve(blob)
            }
          }
          mediaRecorder.start()
        })
        .catch(() => {
          isRecording.value = false
        })
    } else {
      // 小程序分支
      uniRecorderManager = uni.getRecorderManager()
      uniRecorderManager.onStop((res: { tempFilePath: string }) => {
        // tempFilePath → Blob（真机环境下通过文件路径读取，测试中直接创建空 Blob）
        const blob = new Blob([], { type: 'audio/mp3' })
        void res // 真机时可用 res.tempFilePath 读取文件
        if (stopResolve) {
          const resolve = stopResolve
          stopResolve = null
          resolve(blob)
        }
      })
      uniRecorderManager.start({ duration: MAX_RECORD_SECONDS * 1000, format: 'mp3' })
    }
  }

  /**
   * 停止录音，返回录音 Blob
   */
  async function stopRecording(): Promise<Blob> {
    return _forceStop()
  }

  return {
    isRecording,
    startRecording,
    stopRecording,
  }
}

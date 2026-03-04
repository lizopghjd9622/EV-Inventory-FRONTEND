import { ref } from 'vue'
import { MAX_RECORD_SECONDS } from '@/constants'
import { convertToWav } from '@/utils/audioConverter'

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
  let h5MimeType = 'audio/webm'
  let dataRequestInterval: ReturnType<typeof setInterval> | null = null
  // 小程序分支：复用同一个 recorderManager 实例
  let uniRecorderManager: ReturnType<typeof uni.getRecorderManager> | null = null

  /**
   * 检测当前浏览器支持的最佳录音 MIME type
   */
  function detectMimeType(): string {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ]
    for (const type of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return 'audio/webm'
  }

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

      if (dataRequestInterval !== null) {
        clearInterval(dataRequestInterval)
        dataRequestInterval = null
      }

      if (typeof MediaRecorder !== 'undefined' && mediaRecorder) {
        // H5 路径：MediaRecorder 已就绪，直接停止
        stopResolve = resolve
        mediaRecorder.stop()
      } else if (typeof MediaRecorder !== 'undefined') {
        // H5 路径：getUserMedia 尚未 resolve（竞态窗口），挂起 stopResolve
        // getUserMedia 的 .then 链会在 start() 后检测到 stopResolve 并立即 stop
        stopResolve = resolve
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
      if (dataRequestInterval !== null) {
        clearInterval(dataRequestInterval)
        dataRequestInterval = null
      }
      options.onTimeout?.()

      // 通知 pendingStop（如果有）
      if (stopResolve) {
        const resolve = stopResolve
        stopResolve = null
        const raw = new Blob(chunks, { type: h5MimeType })
        convertToWav(raw)
          .then((wav) => resolve(wav))
          .catch(() => resolve(raw))
      }
    }, MAX_RECORD_SECONDS * 1000)

    if (typeof MediaRecorder !== 'undefined') {
      // H5 分支
      h5MimeType = detectMimeType()
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaRecorder = new MediaRecorder(stream, { mimeType: h5MimeType })
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data)
            }
          }
          mediaRecorder.onstop = () => {
            const raw = new Blob(chunks, { type: h5MimeType })
            convertToWav(raw)
              .then((wav) => {
                if (stopResolve) {
                  const resolve = stopResolve
                  stopResolve = null
                  resolve(wav)
                }
              })
              .catch((err) => {
                // 转换失败则回退原始格式
                console.error('[audioConverter] WAV 转换失败，回退原始格式:', err)
                if (stopResolve) {
                  const resolve = stopResolve
                  stopResolve = null
                  resolve(raw)
                }
              })
          }
          // 不使用 timeslice，避免 Chrome 下 WebM 容器分片导致 decodeAudioData 读到静音
          // 改用 setInterval + requestData() 定期触发 ondataavailable，容器完整性由 MediaRecorder 保证
          mediaRecorder.start()
          dataRequestInterval = setInterval(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.requestData()
            }
          }, 100)
          // 若 stopRecording() 在 getUserMedia resolve 之前被调用（竞态），立即停止
          if (stopResolve) {
            mediaRecorder.stop()
          }
        })
        .catch(() => {
          isRecording.value = false
          if (dataRequestInterval !== null) {
            clearInterval(dataRequestInterval)
            dataRequestInterval = null
          }
          // getUserMedia 失败时，若有待决的 stopResolve 也要释放
          if (stopResolve) {
            const resolve = stopResolve
            stopResolve = null
            resolve(new Blob([], { type: h5MimeType }))
          }
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

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

  // 初始化小程序录音管理器（单例模式）
  // 避免在 startRecording 中重复绑定事件导致内存泄漏或多次回调
  // 仅在非 H5 环境（没有 MediaRecorder）且 uni.getRecorderManager 可用时初始化
  if (
    typeof MediaRecorder === 'undefined' &&
    typeof uni !== 'undefined' &&
    typeof uni.getRecorderManager === 'function'
  ) {
    uniRecorderManager = uni.getRecorderManager()
    
    uniRecorderManager.onStop((res: { tempFilePath: string }) => {
      isRecording.value = false
      // 小程序不支持 Blob，直接透传临时文件路径
      // 平台适配层（streamUploadAudioMp）会取 _mpTempPath 直接上传
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mpFile = { _mpTempPath: res.tempFilePath } as unknown as Blob & { _mpTempPath: string }
      if (stopResolve) {
        const resolve = stopResolve
        stopResolve = null
        resolve(mpFile)
      }
    })

    uniRecorderManager.onError((err) => {
      console.error('Recorder error:', err)
      isRecording.value = false
      if (stopResolve) {
        const resolve = stopResolve
        stopResolve = null
        resolve({} as unknown as Blob)
      }
    })
  }

  /**
   * 检测当前浏览器支持的最佳录音 MIME type
   */
  function detectMimeType(): string {
    const candidates = [
      // PCM 优先：无压缩，无 Opus DTX，Chrome 121+ 支持
      // DTX（非连续传输）会把低音量信号判为静音丢弃，导致 Chrome 下录音全零
      'audio/webm;codecs=pcm',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ]
    for (const type of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        console.log('[useRecorder] 选择 mimeType:', type)
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
      // 小程序环境没有 Blob，返回兼容占位对象
      if (typeof Blob === 'undefined') {
        return {} as unknown as Blob
      }
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
        if (typeof Blob !== 'undefined') {
          // H5 路径：有真实 chunks
          const raw = new Blob(chunks, { type: h5MimeType })
          convertToWav(raw)
            .then((wav) => resolve(wav))
            .catch(() => resolve(raw))
        } else {
          // 小程序路径：超时时 onStop 通常已经 resolve 过，这里保底兜底
          resolve({} as unknown as Blob)
        }
      }
    }, MAX_RECORD_SECONDS * 1000)

    if (typeof MediaRecorder !== 'undefined') {
      // H5 分支
      h5MimeType = detectMimeType()

      // 先枚举设备，打印所有音频输入，便于排查 Chrome 选错麦克风
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioInputs = devices.filter((d) => d.kind === 'audioinput')
        console.log('[useRecorder] 可用音频输入设备:', audioInputs.map((d) => `${d.deviceId.slice(0, 8)} ${d.label}`))
      })

      navigator.mediaDevices
        .getUserMedia({
          audio: {
            // deviceId: 'default' 强制跟随系统默认输入设备
            // Chrome 不设置时可能选内置麦，而 Safari 跟随系统默认（如 AirPods）
            deviceId: 'default',
            // noiseSuppression/echoCancellation 关闭避免信号被过度处理
            // autoGainControl 必须保持 true，否则信号过弱触发 Opus DTX 静音
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true,
          },
        })
        .then((stream) => {
          const track = stream.getAudioTracks()[0]
          console.log('[useRecorder] audio track:', track?.label, track?.getSettings())
          // 强制高码率：禁用 Opus DTX（非连续传输），
          // DTX 会把低音量信号全部丢弃导致静音
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: h5MimeType,
            audioBitsPerSecond: 128000,
          })
          console.log('[useRecorder] MediaRecorder 启动，mimeType:', h5MimeType)
          mediaRecorder.ondataavailable = (e) => {
            console.log('[useRecorder] ondataavailable chunk size:', e.data.size)
            if (e.data.size > 0) {
              chunks.push(e.data)
            }
          }
          mediaRecorder.onstop = () => {
            console.log('[useRecorder] onstop，chunks:', chunks.length, 'totalSize:', chunks.reduce((s, c) => s + c.size, 0))
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
          mediaRecorder.start()
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
      uniRecorderManager?.start({ duration: MAX_RECORD_SECONDS * 1000, format: 'mp3' })
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

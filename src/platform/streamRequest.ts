/**
 * 跨平台流式上传音频统一入口
 *
 * H5：使用 fetch + ReadableStream
 * MP-WEIXIN：将 Blob 写入临时文件后用 wx.uploadFile + enableChunked
 */
import { OrderType, SseEventType } from '@/constants'
import type { SseExtractedPayload, SseErrorPayload } from '@/types/api/order'

type SsePayload = SseExtractedPayload | SseErrorPayload

export interface StreamHandlers {
  onEvent: (eventType: SseEventType, data: SsePayload) => void
  onDone: () => void
  onError?: (err: Error) => void
}

// #ifdef H5
export { streamUploadAudio } from './h5/streamRequest'
// #endif

// #ifdef MP-WEIXIN
import { streamUploadAudioMp } from './mp-weixin/streamRequest'

/**
 * 小程序端：优先使用 _mpTempPath（录音带回的临时路径），
 * 没有则把 Blob 写入临时文件再上传
 */
export function streamUploadAudio(
  blob: Blob & { _mpTempPath?: string },
  orderType: OrderType,
  handlers: StreamHandlers,
  _signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = (filePath: string) => {
      streamUploadAudioMp(filePath, orderType, {
        onEvent: handlers.onEvent,
        onDone() {
          handlers.onDone()
          resolve()
        },
        onError(err) {
          handlers.onError?.(err)
          reject(err)
        },
      })
    }

    if (blob._mpTempPath) {
      // 直接使用录音产生的临时文件，无需二次读写
      upload(blob._mpTempPath)
    } else {
      // fallback：将 Blob 写入临时文件
      const fs = uni.getFileSystemManager()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tempPath = `${(wx as any).env.USER_DATA_PATH}/audio_${Date.now()}.mp3`
      blob
        .arrayBuffer()
        .then((buffer) => {
          fs.writeFile({
            filePath: tempPath,
            data: buffer,
            success() { upload(tempPath) },
            fail(err) {
              const e = new Error(err.errMsg ?? '写入临时文件失败')
              handlers.onError?.(e)
              reject(e)
            },
          })
        })
        .catch((err: Error) => {
          handlers.onError?.(err)
          reject(err)
        })
    }
  })
}
// #endif

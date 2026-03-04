/**
 * 将任意浏览器录音 Blob（webm/ogg 等）转换为 WAV Blob
 *
 * 流程：
 *  1. 用 Web Audio API 将原始格式解码为 PCM Float32
 *  2. 混音为单声道（立体声取左右平均）
 *  3. 转 Int16 PCM
 *  4. 写入 44 字节 WAV 头 + PCM 数据
 *
 * WAV 格式无需三方库，匹配度最广泛。
 *
 * @param blob - 原始录音 Blob
 */
export async function convertToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer()

  const audioCtx = new AudioContext()
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

  const sampleRate = audioBuffer.sampleRate
  const numChannels = audioBuffer.numberOfChannels

  // 在关闭 AudioContext 之前立即复制 PCM 数据
  // getChannelData 返回的是内部 typed array 的视图，context 关闭后可能被清零
  const channelData = Array.from({ length: numChannels }, (_, i) =>
    new Float32Array(audioBuffer.getChannelData(i)),
  )
  await audioCtx.close()

  // 混音为单声道 Float32
  let mono: Float32Array
  if (numChannels === 1) {
    mono = channelData[0]
  } else {
    const left = channelData[0]
    const right = channelData[1]
    mono = new Float32Array(left.length)
    for (let i = 0; i < left.length; i++) {
      mono[i] = (left[i] + right[i]) / 2
    }
  }

  // Float32 → Int16 PCM
  const pcm = float32ToInt16(mono)

  // 写 WAV
  const wavBuffer = encodeWav(pcm, sampleRate)
  return new Blob([wavBuffer], { type: 'audio/wav' })
}

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]))
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  }
  return int16
}

/**
 * 生成标准 PCM WAV ArrayBuffer
 * 格式： RIFF / WAVE / fmt  / data
 */
function encodeWav(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = samples.length * 2 // Int16 → bytes
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)       // ChunkSize
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)                  // Subchunk1Size (PCM)
  view.setUint16(20, 1, true)                   // AudioFormat (PCM = 1)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  // 写入 PCM
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset, samples[i], true)
    offset += 2
  }

  return buffer
}

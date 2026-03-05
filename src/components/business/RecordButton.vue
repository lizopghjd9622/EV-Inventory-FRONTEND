<template>
  <view
    class="record-button"
    :class="{ 'record-button--disabled': disabled, 'record-button--recording': isRecording }"
    data-testid="record-btn"
    @touchstart.prevent="handleStart"
    @touchend.prevent="handleStop"
    @mousedown="handleStart"
    @mouseup="handleStop"
  >
    <WaveAnimation :visible="isRecording" />
    <text class="record-button__label">{{ label }}</text>
  </view>
</template>

<script setup lang="ts">
import { useRecorder } from '@/composables/useRecorder'
import WaveAnimation from './WaveAnimation.vue'

// ---------- Props ----------
interface Props {
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

// ---------- Emits ----------
const emit = defineEmits<{
  'record-start': []
  'record-stop': [blob: Blob]
  'record-timeout': []
}>()

// ---------- Recorder ----------
const { startRecording, stopRecording, isRecording } = useRecorder({
  onTimeout: () => emit('record-timeout'),
})

// ---------- Handlers ----------
function handleStart() {
  if (props.disabled) return
  startRecording()
  emit('record-start')
}

async function handleStop() {
  const blob = await stopRecording()
  // 兼容 H5 (size) 和小程序 (_mpTempPath)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (blob && (blob.size > 0 || (blob as any)._mpTempPath)) {
    emit('record-stop', blob)
  }
}
</script>

<style lang="scss" scoped>
.record-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #2e8cff 0%, #0050cc 100%);
  box-shadow: 0 12rpx 40rpx rgba(26, 122, 255, 0.4), 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s, box-shadow 0.15s;

  &:active:not(.record-button--disabled) {
    transform: scale(0.94);
  }

  &--disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }

  &--recording {
    background: linear-gradient(145deg, #ff6b6b 0%, #d9363e 100%);
    box-shadow: 0 12rpx 40rpx rgba(217, 54, 62, 0.45), 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    animation: pulse-ring 1.2s ease-out infinite;
  }

  &__label {
    font-size: 30rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 2rpx;
    text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.2);
  }
}

@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(217, 54, 62, 0.5), 0 12rpx 40rpx rgba(217, 54, 62, 0.45); }
  70%  { box-shadow: 0 0 0 24rpx rgba(217, 54, 62, 0), 0 12rpx 40rpx rgba(217, 54, 62, 0.45); }
  100% { box-shadow: 0 0 0 0 rgba(217, 54, 62, 0), 0 12rpx 40rpx rgba(217, 54, 62, 0.45); }
}
</style>

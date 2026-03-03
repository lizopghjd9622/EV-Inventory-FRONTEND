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
  if (blob) {
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
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background-color: var(--color-primary);
  cursor: pointer;
  user-select: none;

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--recording {
    background-color: var(--color-danger, #f56c6c);
  }

  &__label {
    font-size: 28rpx;
    color: #fff;
    margin-top: 12rpx;
  }
}
</style>

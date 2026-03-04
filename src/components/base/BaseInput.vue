<script setup lang="ts">
// Props 类型定义
interface Props {
  modelValue?: string
  placeholder?: string
  type?: 'text' | 'password' | 'number'
  error?: boolean
  errorText?: string
  disabled?: boolean
}

// Props 声明
const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  type: 'text',
  error: false,
  errorText: '',
  disabled: false,
})

// Emits 声明
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 方法
function handleInput(e: Event) {
  const value = (e as unknown as { detail: { value: string } }).detail?.value ?? (e.target as HTMLInputElement)?.value ?? ''
  emit('update:modelValue', value)
}
</script>

<template>
  <view class="base-input-wrapper">
    <input
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :type="props.type"
      :disabled="props.disabled"
      :class="['base-input', { 'base-input--error': props.error }]"
      @input="handleInput"
    />
    <text v-if="props.error && props.errorText" class="base-input__error-text">
      {{ props.errorText }}
    </text>
    <slot name="error" />
  </view>
</template>

<style lang="scss" scoped>
@use 'styles/variables' as *;

.base-input-wrapper {
  width: 100%;
}

.base-input {
  width: 100%;
  height: 96rpx;
  padding: 0 28rpx;
  border: 2rpx solid #e8ecf4;
  border-radius: 20rpx;
  font-size: $font-size-base;
  color: $color-text-primary;
  background: #f8faff;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: $color-primary;
    background: #fff;
    box-shadow: 0 0 0 6rpx rgba(26, 122, 255, 0.12);
  }

  &--error {
    border-color: $color-error;
    background: #fff8f8;

    &:focus {
      box-shadow: 0 0 0 6rpx rgba(250, 53, 52, 0.1);
    }
  }

  &[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.base-input__error-text {
  display: block;
  margin-top: 10rpx;
  font-size: $font-size-sm;
  color: $color-error;
  padding-left: 8rpx;
}
</style>

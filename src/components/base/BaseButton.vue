<script setup lang="ts">
// Props 类型定义
interface Props {
  label?: string
  loading?: boolean
  disabled?: boolean
  type?: 'primary' | 'default'
}

// Props 声明
const props = withDefaults(defineProps<Props>(), {
  label: '',
  loading: false,
  disabled: false,
  type: 'primary',
})

// Emits 声明
const emit = defineEmits<{
  click: []
}>()

// 方法
function handleClick() {
  if (!props.disabled && !props.loading) {
    emit('click')
  }
}
</script>

<template>
  <button
    :disabled="props.disabled || props.loading"
    :class="['base-button', `base-button--${props.type}`, { 'base-button--loading': props.loading }]"
    @click="handleClick"
  >
    <text v-if="props.loading" class="base-button__loading-icon">●</text>
    <text class="base-button__label">{{ props.label }}</text>
    <slot />
  </button>
</template>

<style lang="scss" scoped>
@use 'styles/variables' as *;

.base-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  padding: 0 $spacing-xl;
  border-radius: $radius-round;
  font-size: $font-size-md;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
  letter-spacing: 2rpx;

  &:active {
    transform: scale(0.97);
    opacity: 0.9;
  }

  &--primary {
    background: linear-gradient(135deg, #2e8cff 0%, #1a7aff 60%, #0050cc 100%);
    color: #fff;
    box-shadow: 0 8rpx 24rpx rgba(26, 122, 255, 0.35);

    &:active {
      box-shadow: 0 4rpx 12rpx rgba(26, 122, 255, 0.25);
    }
  }

  &--default {
    background: #fff;
    color: $color-text-primary;
    border: 2rpx solid #dde4f0;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  }

  &--loading,
  &[disabled] {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  &__loading-icon {
    margin-right: $spacing-xs;
    animation: spin 1s linear infinite;
  }

  &__label {
    line-height: 1;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>

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
  border-radius: $radius-lg;
  font-size: $font-size-md;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: box-shadow $transition-fast;

  &:active {
    box-shadow: $shadow-btn-press;
  }

  &--primary {
    background: $color-primary;
    color: #fff;
  }

  &--default {
    background: $color-bg-white;
    color: $color-text-primary;
    border: 2rpx solid $color-border;
  }

  &--loading,
  &[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
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
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

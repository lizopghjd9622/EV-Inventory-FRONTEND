<script setup lang="ts">
// Props 类型定义
interface Props {
  loading?: boolean
}

// Props 声明
const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Emits 声明
const emit = defineEmits<{
  rerecord: []
  confirm: []
}>()
</script>

<template>
  <view class="action-bar">
    <button
      data-testid="rerecord-btn"
      class="action-bar__btn action-bar__btn--secondary"
      @click="emit('rerecord')"
    >
      <text>重新录音</text>
    </button>
    <button
      data-testid="confirm-btn"
      :disabled="props.loading"
      class="action-bar__btn action-bar__btn--primary"
      @click="emit('confirm')"
    >
      <text>{{ props.loading ? '提交中…' : '确认提交' }}</text>
    </button>
  </view>
</template>

<style lang="scss" scoped>
@use 'styles/variables' as *;

.action-bar {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $color-bg-white;
  border-top: 2rpx solid $color-border;

  &__btn {
    flex: 1;
    height: 96rpx;
    border-radius: $radius-lg;
    font-size: $font-size-md;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: opacity $transition-fast;

    &--primary {
      background: $color-primary;
      color: #fff;

      &[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    &--secondary {
      background: $color-bg-white;
      color: $color-text-secondary;
      border: 2rpx solid $color-border;
    }
  }
}
</style>

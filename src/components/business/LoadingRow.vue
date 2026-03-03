<script setup lang="ts">
// 骨架屏单行组件，用于 StreamingItemList 流式状态显示
</script>

<template>
  <view data-testid="loading-row" class="loading-row">
    <view class="loading-row__cell loading-row__cell--name shimmer" />
    <view class="loading-row__cell loading-row__cell--qty shimmer" />
    <view class="loading-row__cell loading-row__cell--unit shimmer" />
  </view>
</template>

<style lang="scss" scoped>
@use 'styles/variables' as *;

.loading-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-white;
  border-radius: $radius-md;
  margin-bottom: $spacing-sm;

  &__cell {
    height: 40rpx;
    border-radius: $radius-sm;
    background: $color-border;
  }

  &__cell--name {
    flex: 3;
  }

  &__cell--qty {
    flex: 1;
  }

  &__cell--unit {
    flex: 1;
  }
}

.shimmer {
  background: linear-gradient(90deg, $color-border 25%, #f0f0f0 50%, $color-border 75%);
  background-size: 400% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>

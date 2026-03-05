<template>
  <view class="tab-bar">
    <view
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-bar__item"
      :class="{ 'tab-bar__item--active': active === tab.key }"
      @click="handleTap(tab)"
    >
      <text class="tab-bar__icon">{{ tab.icon }}</text>
      <text class="tab-bar__label">{{ tab.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
export type TabKey = 'dashboard' | 'sales' | 'purchase'

const props = defineProps<{ active: TabKey }>()

const tabs: { key: TabKey; label: string; icon: string; path: string }[] = [
  { key: 'dashboard', label: '查询', icon: '🔍', path: '/pages/dashboard/index' },
  { key: 'sales',     label: '销售', icon: '📤', path: '/pages/sales/index' },
  { key: 'purchase',  label: '进货', icon: '📥', path: '/pages/purchase/index' },
]

function handleTap(tab: (typeof tabs)[0]) {
  if (tab.key === props.active) return
  uni.redirectTo({ url: tab.path })
}
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  border-top: 1rpx solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 999;
  // 安全区域适配
  padding-bottom: env(safe-area-inset-bottom);

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 4rpx;
    opacity: 0.45;
    transition: opacity 0.15s;

    &--active {
      opacity: 1;
    }
  }

  &__icon {
    font-size: 36rpx;
  }

  &__label {
    font-size: 20rpx;
    color: #999;
    font-weight: 500;

    .tab-bar__item--active & {
      color: #1a7aff;
    }
  }
}
</style>

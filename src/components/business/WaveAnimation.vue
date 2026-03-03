<script setup lang="ts">
// Props 类型定义
interface Props {
  /** 控制波形动画的显示/隐藏 */
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})
</script>

<template>
  <view v-if="props.visible" class="wave-animation">
    <view v-for="i in 5" :key="i" :class="['wave-bar', `wave-bar--${i}`]" />
  </view>
</template>

<style lang="scss" scoped>
@use 'styles/variables' as *;

.wave-animation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  height: 48rpx;
}

.wave-bar {
  width: 8rpx;
  border-radius: 4rpx;
  background: $color-primary;
  animation: wave 1s ease-in-out infinite;

  @for $i from 1 through 5 {
    &--#{$i} {
      animation-delay: #{($i - 1) * 0.15}s;
      height: #{20 + ($i % 3) * 12}rpx;
    }
  }
}

@keyframes wave {
  0%,
  100% {
    transform: scaleY(0.5);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>

<template>
  <view v-if="visible" class="captcha-block">
    <view class="captcha-block__image-row">
      <image
        class="captcha-block__image"
        :src="imageUrl"
        mode="aspectFit"
        data-testid="captcha-image"
        @click="emit('refresh')"
      />
      <text class="captcha-block__hint" @click="emit('refresh')">点击刷新</text>
    </view>
    <BaseInput
      v-model="inputValue"
      placeholder="请输入验证码"
      data-testid="captcha-input"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'

// ---------- Props ----------
interface Props {
  visible: boolean
  imageUrl: string
}

defineProps<Props>()

// ---------- Emits ----------
const emit = defineEmits<{
  refresh: []
  'update:value': [value: string]
}>()

// ---------- State ----------
const inputValue = ref('')

// ---------- Watchers ----------
watch(inputValue, (val) => {
  emit('update:value', val)
})
</script>

<style lang="scss" scoped>
.captcha-block {
  margin-top: 24rpx;

  &__image-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 12rpx;
  }

  &__image {
    width: 240rpx;
    height: 80rpx;
    border-radius: 8rpx;
    border: 1rpx solid var(--color-border, #e4e7ed);
  }

  &__hint {
    font-size: 24rpx;
    color: var(--color-primary);
    cursor: pointer;
  }
}
</style>

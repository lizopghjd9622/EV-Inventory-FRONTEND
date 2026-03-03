<template>
  <view class="home-page">
    <view class="home-page__header">
      <text class="home-page__title">语音录单</text>
    </view>

    <!-- 错误 Banner -->
    <view v-if="store.status === RecordStatus.Error" class="home-page__error-banner" data-testid="error-banner">
      <text class="home-page__error-text">{{ store.errorMessage }}</text>
      <BaseButton
        label="重新发送"
        type="primary"
        data-testid="resend-btn"
        @click="handleResend"
      />
    </view>

    <!-- 录音按钮区域 -->
    <view class="home-page__buttons">
      <view class="home-page__button-wrapper">
        <RecordButton
          label="销售"
          :disabled="store.status !== RecordStatus.Idle && store.status !== RecordStatus.Error"
          data-testid="sales-btn"
          @record-start="handleRecordStart(OrderType.SALES)"
          @record-stop="handleRecordStop"
          @record-timeout="handleRecordTimeout"
        />
        <text class="home-page__button-label">销售录单</text>
      </view>

      <view class="home-page__button-wrapper">
        <RecordButton
          label="进货"
          :disabled="store.status !== RecordStatus.Idle && store.status !== RecordStatus.Error"
          data-testid="purchase-btn"
          @record-start="handleRecordStart(OrderType.PURCHASE)"
          @record-stop="handleRecordStop"
          @record-timeout="handleRecordTimeout"
        />
        <text class="home-page__button-label">进货录单</text>
      </view>
    </view>

    <!-- 状态提示 -->
    <view class="home-page__status-hint">
      <text v-if="store.status === RecordStatus.Recording" class="home-page__status-text" data-testid="recording-hint">
        正在录音，松开发送…
      </text>
      <text v-if="store.status === RecordStatus.Streaming" class="home-page__status-text" data-testid="streaming-hint">
        识别中，请稍候…
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useVoiceOrderStore } from '@/stores/voiceOrder'
import { useVoiceOrder } from '@/composables/useVoiceOrder'
import { requireAuth } from '@/utils/routeGuard'
import { OrderType, RecordStatus } from '@/constants'
import RecordButton from '@/components/business/RecordButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'

// ---------- Store & Composable ----------
const store = useVoiceOrderStore()
const voiceOrder = useVoiceOrder()

// ---------- Lifecycle ----------
onMounted(() => {
  requireAuth()
})

// ---------- Watch ----------
watch(
  () => store.status,
  (newStatus) => {
    if (newStatus === RecordStatus.Done) {
      uni.navigateTo({ url: '/pages/order-detail/index' })
    }
  },
)

// ---------- Handlers ----------
function handleRecordStart(orderType: OrderType) {
  currentOrderType = orderType
  store.initSession(orderType)
  store.setStatus(RecordStatus.Recording)
}

async function handleRecordStop(blob: Blob) {
  store.setAudioBlob(blob)
  await voiceOrder.startVoiceOrder(blob)
}

function handleRecordTimeout() {
  uni.showToast({ title: '已达最大时长，自动发送', icon: 'none' })
}

async function handleResend() {
  if (!store.audioBlob) return
  await voiceOrder.startVoiceOrder(store.audioBlob)
}
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background-color: var(--color-bg, #f5f7fa);
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__header {
    width: 100%;
    margin-bottom: 64rpx;
    text-align: center;
  }

  &__title {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--color-text-primary, #303133);
  }

  &__error-banner {
    width: 100%;
    padding: 24rpx;
    border-radius: 12rpx;
    background-color: #fef0f0;
    border: 1rpx solid #fde2e2;
    margin-bottom: 40rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__error-text {
    font-size: 28rpx;
    color: var(--color-danger, #f56c6c);
    flex: 1;
    margin-right: 16rpx;
  }

  &__buttons {
    display: flex;
    gap: 80rpx;
    justify-content: center;
    margin-top: 80rpx;
  }

  &__button-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__button-label {
    margin-top: 16rpx;
    font-size: 28rpx;
    color: var(--color-text-secondary, #606266);
  }

  &__status-hint {
    margin-top: 48rpx;
    text-align: center;
  }

  &__status-text {
    font-size: 28rpx;
    color: var(--color-text-secondary, #606266);
  }
}
</style>

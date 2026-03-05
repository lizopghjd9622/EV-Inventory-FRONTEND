<template>
  <view class="purchase-page">
    <!-- 主内容 -->
    <view class="purchase-page__main">
      <!-- 图标 -->
      <view class="purchase-page__icon-wrap">
        <text class="purchase-page__icon">📥</text>
      </view>

      <!-- 标题 -->
      <text class="purchase-page__title">进货录单</text>
      <text class="purchase-page__desc">长按按钮，语音创建进货单</text>

      <!-- 状态提示 -->
      <view class="purchase-page__status-hint">
        <text
          v-if="store.status === RecordStatus.Recording"
          class="purchase-page__status-text purchase-page__status-text--recording"
        >
          🎙 正在录音，松开发送…
        </text>
        <text
          v-else-if="store.status === RecordStatus.Streaming"
          class="purchase-page__status-text purchase-page__status-text--streaming"
        >
          ⚡ 识别中，请稍候…
        </text>
        <text v-else class="purchase-page__status-text purchase-page__status-text--idle">
          <!-- 长按按钮开始录音 -->
        </text>
      </view>

      <!-- 录音按钮 -->
      <view class="purchase-page__btn-wrap">
        <RecordButton
          label="进货"
          :disabled="store.status !== RecordStatus.Idle"
          data-testid="purchase-btn"
          @record-start="handleRecordStart"
          @record-stop="handleRecordStop"
          @record-timeout="handleRecordTimeout"
        />
      </view>

      <!-- 手动录单 -->
      <view
        class="purchase-page__manual-entry"
        :class="{ 'purchase-page__manual-entry--disabled': store.status !== RecordStatus.Idle }"
        @click="handleManualEntry"
      >
        <text>✏️ 手动录单</text>
      </view>

      <!-- 提示 -->
      <view class="purchase-page__tips">
        <text class="purchase-page__tips-text">💡 说出品名、数量、单价，自动生成进货单</text>
      </view>
    </view>

    <!-- 底部导航 -->
    <BottomTabBar active="purchase" />
  </view>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useVoiceOrderStore } from '@/stores/voiceOrder'
import { useVoiceOrder } from '@/composables/useVoiceOrder'
import { requireAuth } from '@/utils/routeGuard'
import { OrderType, RecordStatus } from '@/constants'
import RecordButton from '@/components/business/RecordButton.vue'
import BottomTabBar from '@/components/business/BottomTabBar.vue'

const store = useVoiceOrderStore()
const voiceOrder = useVoiceOrder()

onMounted(() => {
  requireAuth()
})

watch(
  () => store.status,
  (newStatus) => {
    if (newStatus === RecordStatus.Done) {
      uni.navigateTo({ url: '/pages/order-detail/index' })
    }
  },
)

function handleRecordStart() {
  store.initSession(OrderType.PURCHASE)
  store.setStatus(RecordStatus.Recording)
}

async function handleRecordStop(blob: Blob) {
  store.setAudioBlob(blob)
  await voiceOrder.startVoiceOrder(blob)
}

function handleRecordTimeout() {
  uni.showToast({ title: '已达最大时长，自动发送', icon: 'none' })
}

function handleManualEntry() {
  if (store.status !== RecordStatus.Idle) return
  store.initSession(OrderType.PURCHASE)
  store.setStatus(RecordStatus.Done)
}
</script>

<style lang="scss" scoped>
.purchase-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0fff4 0%, #f5fef8 100%);
  display: flex;
  flex-direction: column;
  padding-bottom: 120rpx; // 底部留给 tabBar

  &__error-banner {
    margin: 24rpx 32rpx 0;
    padding: 24rpx 28rpx;
    border-radius: 20rpx;
    background: #fff2f0;
    border: 2rpx solid #ffccc7;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4rpx 16rpx rgba(255, 77, 79, 0.1);
  }

  &__error-content {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex: 1;
    margin-right: 16rpx;
  }

  &__error-icon {
    font-size: 32rpx;
    flex-shrink: 0;
  }

  &__error-text {
    font-size: 26rpx;
    color: #cf1322;
    line-height: 1.5;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 32rpx 48rpx;
  }

  &__icon-wrap {
    width: 140rpx;
    height: 140rpx;
    border-radius: 40rpx;
    background: linear-gradient(135deg, #00b894 0%, #00796b 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
    box-shadow: 0 12rpx 40rpx rgba(0, 184, 148, 0.3);
  }

  &__icon {
    font-size: 64rpx;
  }

  &__title {
    font-size: 48rpx;
    font-weight: 800;
    color: #1a1a1a;
    margin-bottom: 12rpx;
    letter-spacing: 2rpx;
  }

  &__desc {
    font-size: 28rpx;
    color: #888;
    margin-bottom: 60rpx;
  }

  &__status-hint {
    min-height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 60rpx;
  }

  &__status-text {
    font-size: 28rpx;
    padding: 12rpx 32rpx;
    border-radius: 100rpx;

    &--idle {
      color: #999;
      background: transparent;
    }

    &--recording {
      color: #cf1322;
      background: #fff2f0;
      border: 2rpx solid #ffccc7;
    }

    &--streaming {
      color: #007a5e;
      background: #f0fff4;
      border: 2rpx solid #b7edd0;
    }
  }

  &__btn-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 40rpx;
  }

  &__manual-entry {
    margin-bottom: 48rpx;
    font-size: 28rpx;
    color: #00796b;
    padding: 12rpx 40rpx;
    border-radius: 100rpx;
    border: 2rpx solid #b7edd0;
    background: #f0fff4;

    &--disabled {
      color: #bbb;
      border-color: #e5e5e5;
      background: #f5f5f5;
      pointer-events: none;
    }
  }

  &__tips {
    padding: 0 40rpx;
  }

  &__tips-text {
    font-size: 24rpx;
    color: #bbb;
    text-align: center;
    display: block;
  }
}
</style>

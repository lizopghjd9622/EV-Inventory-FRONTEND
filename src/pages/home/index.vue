<template>
  <view class="home-page">
    <!-- 顶部导航栏 -->
    <view class="home-page__navbar">
      <view class="home-page__navbar-inner">
        <view class="home-page__navbar-logo">
          <text class="home-page__navbar-logo-icon">⚡</text>
        </view>
        <text class="home-page__title">语音录单</text>
      </view>
    </view>

    <!-- 主操作区 -->
    <view class="home-page__main">
      <!-- 状态提示文字 -->
      <view class="home-page__status-hint">
        <text
          v-if="store.status === RecordStatus.Recording"
          class="home-page__status-text home-page__status-text--recording"
          data-testid="recording-hint"
        >
          🎙 正在录音，松开发送…
        </text>
        <text
          v-else-if="store.status === RecordStatus.Streaming"
          class="home-page__status-text home-page__status-text--streaming"
          data-testid="streaming-hint"
        >
          ⚡ 识别中，请稍候…
        </text>
        <text v-else class="home-page__status-text home-page__status-text--idle">
          长按按钮开始录音
        </text>
      </view>

      <!-- 录音按钮区域 -->
      <view class="home-page__buttons">
        <view class="home-page__button-card home-page__button-card--sales">
          <RecordButton
            label="销售"
            :disabled="store.status !== RecordStatus.Idle"
            data-testid="sales-btn"
            @record-start="handleRecordStart(OrderType.SALES)"
            @record-stop="handleRecordStop"
            @record-timeout="handleRecordTimeout"
          />
          <text class="home-page__button-label">销售录单</text>
          <text class="home-page__button-desc">出库销售单</text>
        </view>

        <view class="home-page__button-card home-page__button-card--purchase">
          <RecordButton
            label="进货"
            :disabled="store.status !== RecordStatus.Idle"
            data-testid="purchase-btn"
            @record-start="handleRecordStart(OrderType.PURCHASE)"
            @record-stop="handleRecordStop"
            @record-timeout="handleRecordTimeout"
          />
          <text class="home-page__button-label">进货录单</text>
          <text class="home-page__button-desc">入库采购单</text>
        </view>
      </view>

      <!-- 使用说明 -->
      <view class="home-page__tips">
        <text class="home-page__tips-text">💡 长按按钮录音，松开自动识别并生成订单</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useVoiceOrderStore } from '@/stores/voiceOrder'
import { useVoiceOrder } from '@/composables/useVoiceOrder'
import { requireAuth } from '@/utils/routeGuard'
import { OrderType, RecordStatus } from '@/constants'
import RecordButton from '@/components/business/RecordButton.vue'

// ---------- Store & Composable ----------
const store = useVoiceOrderStore()
const voiceOrder = useVoiceOrder()
let currentOrderType: OrderType = OrderType.SALES

// ---------- Lifecycle ----------
onMounted(() => {
  requireAuth()
})

onShow(() => {
  // order-detail 页面正常敏消时会在 onUnload 里重置。
  // 这里仅处理极端情况：order-detail onUnload 未执行但状态仍卡在 Done
  // （如浏览器制高层导航），居安危不乱动
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


</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4ff 0%, #f8faff 100%);
  display: flex;
  flex-direction: column;

  &__navbar {
    background: #fff;
    box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);
    padding: 0 40rpx;
  }

  &__navbar-inner {
    display: flex;
    align-items: center;
    gap: 16rpx;
    height: 100rpx;
  }

  &__navbar-logo {
    width: 56rpx;
    height: 56rpx;
    border-radius: 14rpx;
    background: linear-gradient(135deg, #1a7aff 0%, #0050cc 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__navbar-logo-icon {
    font-size: 30rpx;
  }

  &__title {
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: 2rpx;
  }

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
    padding: 48rpx 32rpx;
  }

  &__status-hint {
    min-height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 56rpx;
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
      color: #0050cc;
      background: #e8f0ff;
      border: 2rpx solid #bcd0ff;
    }
  }

  &__buttons {
    display: flex;
    gap: 32rpx;
    justify-content: center;
    width: 100%;
  }

  &__button-card {
    flex: 1;
    max-width: 300rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rpx 24rpx 36rpx;
    background: #fff;
    border-radius: 32rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
    transition: box-shadow 0.2s;

    &--sales {
      border-top: 6rpx solid #1a7aff;
    }

    &--purchase {
      border-top: 6rpx solid #19be6b;
    }
  }

  &__button-label {
    margin-top: 24rpx;
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
  }

  &__button-desc {
    margin-top: 8rpx;
    font-size: 22rpx;
    color: #aaa;
  }

  &__tips {
    margin-top: 56rpx;
    padding: 20rpx 36rpx;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 100rpx;
    border: 2rpx solid #e8eeff;
  }

  &__tips-text {
    font-size: 24rpx;
    color: #888;
  }
}
</style>

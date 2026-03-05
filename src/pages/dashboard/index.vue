<template>
  <view class="dashboard-page">
    <!-- 头部 -->
    <view class="dashboard-page__header">
      <view class="dashboard-page__header-logo">
        <text class="dashboard-page__header-logo-icon">⚡</text>
      </view>
      <view class="dashboard-page__header-info">
        <text class="dashboard-page__header-title">老板助手</text>
        <text class="dashboard-page__header-sub">EV 库存智能查询</text>
      </view>
    </view>

    <!-- 查询区域 -->
    <view class="dashboard-page__query-card">
      <text class="dashboard-page__section-title">查询数据</text>
      <text class="dashboard-page__section-hint">输入问题，或长按语音提问</text>

      <!-- 文字输入 -->
      <view class="dashboard-page__input-row">
        <textarea
          v-model="queryText"
          class="dashboard-page__textarea"
          placeholder="例如：今天卖了多少辆？本月进货总额是多少？"
          :maxlength="200"
          auto-height
        />
      </view>

      <!-- 操作按钮 -->
      <view class="dashboard-page__actions">
        <!-- 语音按钮 -->
        <view
          class="dashboard-page__voice-btn"
          :class="{ 'dashboard-page__voice-btn--active': isVoiceHolding }"
          @touchstart.prevent="handleVoiceStart"
          @touchend.prevent="handleVoiceEnd"
          @touchcancel.prevent="handleVoiceEnd"
        >
          <text class="dashboard-page__voice-btn-icon">🎙</text>
          <text class="dashboard-page__voice-btn-label">
            {{ isVoiceHolding ? '🔴 松开发送' : '长按语音提问' }}
          </text>
        </view>

        <!-- 文字发送按钮 -->
        <view
          class="dashboard-page__send-btn"
          :class="{ 'dashboard-page__send-btn--active': queryText.trim().length > 0 }"
          @click="handleTextQuery"
        >
          <text class="dashboard-page__send-btn-text">发送</text>
        </view>
      </view>
    </view>

    <!-- 结果区域 / 占位 -->
    <view class="dashboard-page__result-area">
      <view class="dashboard-page__coming-soon">
        <text class="dashboard-page__coming-soon-icon">🚀</text>
        <text class="dashboard-page__coming-soon-title">查询功能即将上线</text>
        <text class="dashboard-page__coming-soon-desc">老板助手正在研发中，敬请期待</text>
      </view>
    </view>

    <!-- 底部导航 -->
    <BottomTabBar active="dashboard" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { requireAuth } from '@/utils/routeGuard'
import BottomTabBar from '@/components/business/BottomTabBar.vue'

const queryText = ref('')
const isVoiceHolding = ref(false)

onMounted(() => {
  requireAuth()
})

function handleTextQuery() {
  if (!queryText.value.trim()) return
  uni.showToast({ title: '查询功能即将上线', icon: 'none', duration: 2000 })
}

function handleVoiceStart() {
  isVoiceHolding.value = true
}

function handleVoiceEnd() {
  if (!isVoiceHolding.value) return
  isVoiceHolding.value = false
  uni.showToast({ title: '查询功能即将上线', icon: 'none', duration: 2000 })
}
</script>

<style lang="scss" scoped>
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #eef3ff 0%, #f8faff 100%);
  display: flex;
  flex-direction: column;
  padding-bottom: 120rpx; // 底部留给 tabBar

  &__header {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 40rpx 40rpx 32rpx;
    background: linear-gradient(135deg, #1a7aff 0%, #0050cc 100%);
  }

  &__header-logo {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__header-logo-icon {
    font-size: 44rpx;
  }

  &__header-info {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &__header-title {
    font-size: 40rpx;
    font-weight: 800;
    color: #fff;
    letter-spacing: 2rpx;
  }

  &__header-sub {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }

  &__query-card {
    margin: 32rpx 32rpx 0;
    background: #fff;
    border-radius: 24rpx;
    padding: 36rpx;
    box-shadow: 0 4rpx 24rpx rgba(26, 122, 255, 0.08);
  }

  &__section-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a1a;
    display: block;
    margin-bottom: 8rpx;
  }

  &__section-hint {
    font-size: 24rpx;
    color: #999;
    display: block;
    margin-bottom: 28rpx;
  }

  &__input-row {
    background: #f5f7fb;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
    min-height: 140rpx;
  }

  &__textarea {
    width: 100%;
    font-size: 28rpx;
    color: #333;
    line-height: 1.6;
    background: transparent;
    min-height: 100rpx;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  &__voice-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
    background: #f0f4ff;
    border: 2rpx solid #d0dcff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    transition: all 0.15s;

    &--active {
      background: #fff0f0;
      border-color: #ffccc7;
    }
  }

  &__voice-btn-icon {
    font-size: 32rpx;
  }

  &__voice-btn-label {
    font-size: 26rpx;
    color: #1a7aff;
    font-weight: 500;
  }

  &__send-btn {
    width: 120rpx;
    height: 88rpx;
    border-radius: 44rpx;
    background: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;

    &--active {
      background: linear-gradient(135deg, #1a7aff 0%, #0050cc 100%);
    }
  }

  &__send-btn-text {
    font-size: 28rpx;
    color: #fff;
    font-weight: 600;
  }

  &__result-area {
    flex: 1;
    margin: 32rpx 32rpx 0;
    background: #fff;
    border-radius: 24rpx;
    padding: 60rpx 40rpx;
    box-shadow: 0 4rpx 24rpx rgba(26, 122, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300rpx;
  }

  &__coming-soon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
  }

  &__coming-soon-icon {
    font-size: 80rpx;
  }

  &__coming-soon-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #333;
  }

  &__coming-soon-desc {
    font-size: 26rpx;
    color: #999;
    text-align: center;
  }
}
</style>

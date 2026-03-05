<template>
  <view class="order-detail-page">
    <view class="order-detail-page__header">
      <text class="order-detail-page__title">
        {{ store.orderType === OrderType.SALES ? '销售单确认' : '进货单确认' }}
      </text>
    </view>

    <!-- 流式条目列表 -->
    <StreamingItemList
      :items="store.items"
      :streaming="store.status === RecordStatus.Streaming"
      data-testid="item-list"
      @update:item="store.updateItem"
      @delete="store.deleteItem"
    />

    <!-- 操作栏 -->
    <ActionBar
      :loading="confirming"
      data-testid="action-bar"
      @rerecord="handleRerecord"
      @confirm="handleConfirm"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import { useVoiceOrderStore } from '@/stores/voiceOrder'
import { requireAuth } from '@/utils/routeGuard'
import { confirmSalesOrder, confirmPurchaseOrder } from '@/services/order'
import { OrderType, RecordStatus } from '@/constants'
import StreamingItemList from '@/components/business/StreamingItemList.vue'
import ActionBar from '@/components/business/ActionBar.vue'

// ---------- Store ----------
const store = useVoiceOrderStore()

// ---------- State ----------
const confirming = ref(false)

// ---------- Lifecycle ----------
onMounted(() => {
  requireAuth()
  // 防止直接访问：orderId 为 null 且不属于流式展示中
  if (store.orderId === null && store.status !== RecordStatus.Streaming) {
    uni.redirectTo({ url: '/pages/dashboard/index' })
  }
})

// 页面被销毁时重置 store（包括返回按鈕、reLaunch）
onUnload(() => {
  store.initSession(store.orderType as OrderType)
})

// ---------- Handlers ----------
function handleRerecord() {
  store.initSession(store.orderType)
  uni.navigateBack()
}

async function handleConfirm() {
  if (store.orderId === null) return

  confirming.value = true
  try {
    if (store.orderType === OrderType.SALES) {
      await confirmSalesOrder(store.orderId)
    } else {
      await confirmPurchaseOrder(store.orderId)
    }
    uni.redirectTo({ url: '/pages/dashboard/index' })
  } catch (err: unknown) {
    const error = err as { data?: { detail?: string } }
    const msg = error?.data?.detail ?? '提交失败，请稍后重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    confirming.value = false
  }
}
</script>

<style lang="scss" scoped>
.order-detail-page {
  min-height: 100vh;
  background-color: var(--color-bg, #f5f7fa);
  padding: 0 0 120rpx; // 底部预留 ActionBar 空间

  &__header {
    padding: 32rpx 48rpx;
    background-color: #fff;
    border-bottom: 1rpx solid var(--color-border, #e4e7ed);
  }

  &__title {
    font-size: 36rpx;
    font-weight: 600;
    color: var(--color-text-primary, #303133);
  }
}
</style>

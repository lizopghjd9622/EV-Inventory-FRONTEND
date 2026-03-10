<template>
  <view class="order-detail-page">
    <view class="order-detail-page__header">
      <text class="order-detail-page__title">
        {{ store.orderType === OrderType.SALES ? '销售单确认' : '进货单确认' }}
      </text>
    </view>

    <!-- 汇总摘要 -->
    <view v-if="store.items.length > 0 && store.status !== RecordStatus.Streaming" class="order-detail-page__summary">
      <view class="order-detail-page__summary-item">
        <text class="order-detail-page__summary-label">总台数</text>
        <text class="order-detail-page__summary-value">{{ totalQuantity }} 台</text>
      </view>
      <view class="order-detail-page__summary-divider" />
      <view class="order-detail-page__summary-item">
        <text class="order-detail-page__summary-label">
          {{ store.orderType === OrderType.SALES ? '总金额' : '总成本' }}
        </text>
        <text class="order-detail-page__summary-value order-detail-page__summary-value--amount">
          ¥{{ totalAmount.toLocaleString() }}
        </text>
      </view>
    </view>

    <!-- 流式条目列表 -->
    <StreamingItemList
      :items="store.items"
      :streaming="store.status === RecordStatus.Streaming"
      :order-type="store.orderType"
      data-testid="item-list"
      @update:item="store.updateItem"
      @delete="store.deleteItem"
      @add="handleAddItem"
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
import { ref, computed, onMounted } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import { useVoiceOrderStore } from '@/stores/voiceOrder'
import { requireAuth } from '@/utils/routeGuard'
import { createAndConfirmSalesOrder, createAndConfirmPurchaseOrder } from '@/services/order'
import type { OrderItemRequest } from '@/services/order'
import { OrderType, RecordStatus } from '@/constants'
import StreamingItemList from '@/components/business/StreamingItemList.vue'
import ActionBar from '@/components/business/ActionBar.vue'

// ---------- Store ----------
const store = useVoiceOrderStore()

// ---------- State ----------
const confirming = ref(false)

// ---------- Computed ----------
const totalQuantity = computed(() =>
  store.items.reduce((sum, item) => sum + Number(item.quantity), 0),
)
const totalAmount = computed(() =>
  store.items.reduce((sum, item) => {
    const price = item.price ?? item.cost ?? 0
    return sum + Number(item.quantity) * Number(price)
  }, 0),
)

// ---------- Lifecycle ----------
onMounted(() => {
  requireAuth()
  // 防止直接访问：仅当状态为 Idle（未经过录音流程）时才拦截
  if (store.status === RecordStatus.Idle) {
    uni.redirectTo({ url: '/pages/dashboard/index' })
  }
})

// 页面被销毁时重置 store（包括返回按鈕、reLaunch）
onUnload(() => {
  store.initSession(store.orderType as OrderType)
})

// ---------- Handlers ----------
function handleAddItem() {
  store.appendItem({
    clientId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: '',
    quantity: 1,
    unit: '个',
    price: store.orderType === OrderType.SALES ? 0 : undefined,
    cost: store.orderType === OrderType.SALES ? undefined : 0,
  })
}

function handleRerecord() {
  store.initSession(store.orderType)
  uni.navigateBack()
}

async function handleConfirm() {
  confirming.value = true
  try {
    const items: OrderItemRequest[] = store.items.map((item) => {
      const unitPrice = item.price ?? item.cost ?? 0
      return {
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: unitPrice,
        amount: Number(item.quantity) * Number(unitPrice),
      }
    })

    if (store.orderType === OrderType.SALES) {
      await createAndConfirmSalesOrder({ items })
    } else {
      await createAndConfirmPurchaseOrder({ items })
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

  &__summary {
    display: flex;
    align-items: center;
    margin: 20rpx 32rpx 0;
    padding: 24rpx 32rpx;
    background: #fff;
    border-radius: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  }

  &__summary-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
  }

  &__summary-label {
    font-size: 24rpx;
    color: #999;
  }

  &__summary-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a1a;

    &--amount {
      color: #00796b;
    }
  }

  &__summary-divider {
    width: 1rpx;
    height: 48rpx;
    background: #e5e5e5;
    margin: 0 24rpx;
  }
}
</style>

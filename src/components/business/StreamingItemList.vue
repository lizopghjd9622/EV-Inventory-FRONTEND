<script setup lang="ts">
import { computed } from 'vue'
import type { EditableOrderItem } from '@/types/models/order'
import { OrderType } from '@/constants'
import LoadingRow from './LoadingRow.vue'
import OrderItemRow from './OrderItemRow.vue'

// Props 类型定义
interface Props {
  streaming: boolean
  items: EditableOrderItem[]
  orderType: OrderType
}

// Props 声明
const props = defineProps<Props>()

// Emits 声明
const emit = defineEmits<{
  'update:item': [patch: EditableOrderItem]
  delete: [clientId: string]
  add: []
}>()

// 是否展示空状态提示
const isEmpty = computed(() => !props.streaming && props.items.length === 0)
</script>

<template>
  <view class="streaming-item-list">
    <!-- 流式加载骨架屏 -->
    <template v-if="props.streaming">
      <LoadingRow v-for="i in 3" :key="i" />
    </template>

    <!-- 条目列表 -->
    <transition-group v-else name="list-item" tag="div">
      <OrderItemRow
        v-for="item in props.items"
        :key="item.clientId"
        :item="item"
        :order-type="props.orderType"
        @update:item="(patch) => emit('update:item', patch)"
        @delete="(id) => emit('delete', id)"
      />
    </transition-group>

    <!-- 空状态提示 -->
    <view v-if="isEmpty" data-testid="empty-hint" class="streaming-item-list__empty">
      <text>暂无识别结果</text>
    </view>

    <!-- 添加商品按钮 -->
    <view v-if="!props.streaming" class="streaming-item-list__add" @click="emit('add')">
      <text class="streaming-item-list__add-icon">＋</text>
      <text class="streaming-item-list__add-text">添加商品</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import 'styles/variables';

.streaming-item-list {
  padding: $spacing-sm 0;

  &__empty {
    padding: $spacing-xxl $spacing-md;
    text-align: center;
    color: $color-text-placeholder;
    font-size: $font-size-sm;
  }
  &__add {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    margin: $spacing-sm $spacing-md;
    padding: $spacing-md;
    border: 2rpx dashed $color-primary;
    border-radius: $radius-md;
    color: $color-primary;
    cursor: pointer;
    &-icon { font-size: $font-size-lg; line-height: 1; }
    &-text { font-size: $font-size-sm; }
  }
}
</style>
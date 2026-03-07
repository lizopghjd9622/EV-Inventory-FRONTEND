<script setup lang="ts">
import { ref, watch } from 'vue'
import type { EditableOrderItem } from '@/types/models/order'
import { OrderType } from '@/constants'

// Props 类型定义
interface Props {
  item: EditableOrderItem
  orderType: OrderType
}

// Props 声明
const props = defineProps<Props>()

// Emits 声明
const emit = defineEmits<{
  'update:item': [patch: EditableOrderItem]
  delete: [clientId: string]
}>()

// ---------- 本地状态（输入过程中不触发父级重渲染）----------
const localName = ref(props.item.name)
const localQuantity = ref(String(props.item.quantity))
const localUnit = ref(props.item.unit)
const localPrice = ref(
  (() => {
    const v = props.orderType === OrderType.SALES ? props.item.price : props.item.cost
    return v !== undefined ? String(v) : ''
  })(),
)

// 外部 item 切换时（clientId 变化）同步本地值
watch(
  () => props.item.clientId,
  () => {
    localName.value = props.item.name
    localQuantity.value = String(props.item.quantity)
    localUnit.value = props.item.unit
    const v = props.orderType === OrderType.SALES ? props.item.price : props.item.cost
    localPrice.value = v !== undefined ? String(v) : ''
  },
)

// ---------- 失焦时才同步到 store ----------
function commitName() {
  emit('update:item', { ...props.item, name: localName.value })
}
function commitQuantity() {
  emit('update:item', { ...props.item, quantity: Number(localQuantity.value) || 0 })
}
function commitUnit() {
  emit('update:item', { ...props.item, unit: localUnit.value })
}
function commitPrice() {
  const value = Number(localPrice.value) || 0
  if (props.orderType === OrderType.SALES) {
    emit('update:item', { ...props.item, price: value })
  } else {
    emit('update:item', { ...props.item, cost: value })
  }
}

function handleDelete() {
  emit('delete', props.item.clientId)
}
</script>

<template>
  <view data-testid="order-item-row" class="order-item-row">
    <input
      data-testid="item-name"
      v-model="localName"
      placeholder="商品名称"
      class="order-item-row__input order-item-row__input--name"
      @blur="commitName"
    />
    <input
      data-testid="item-quantity"
      v-model="localQuantity"
      placeholder="数量"
      type="number"
      class="order-item-row__input order-item-row__input--qty"
      @blur="commitQuantity"
    />
    <input
      data-testid="item-unit"
      v-model="localUnit"
      placeholder="单位"
      class="order-item-row__input order-item-row__input--unit"
      @blur="commitUnit"
    />
    <input
      data-testid="item-price"
      v-model="localPrice"
      placeholder="单价"
      type="number"
      class="order-item-row__input order-item-row__input--price"
      @blur="commitPrice"
    />
    <text class="order-item-row__price-unit">元/{{ props.item.unit || '单位' }}</text>
    <button
      data-testid="delete-btn"
      class="order-item-row__delete"
      @click="handleDelete"
    >
      <text>×</text>
    </button>
  </view>
</template>

<style lang="scss" scoped>
@import 'styles/variables';

.order-item-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-white;
  border-radius: $radius-md;
  margin-bottom: $spacing-sm;
  box-shadow: $shadow-card;

  &__input {
    height: 72rpx;
    padding: 0 $spacing-sm;
    border: 2rpx solid $color-border;
    border-radius: $radius-sm;
    font-size: $font-size-sm;
    color: $color-text-primary;
    background: $color-bg-white;

    &--name {
      flex: 3;
    }

    &--qty {
      flex: 1.2;
    }

    &--unit {
      flex: 1;
    }

    &--price {
      flex: 1.2;
    }
  }

  &__price-unit {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__delete {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: #fff0f0;
    color: $color-error;
    font-size: $font-size-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: none;
  }
}
</style>

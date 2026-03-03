<script setup lang="ts">
import type { EditableOrderItem } from '@/types/models/order'

// Props 类型定义
interface Props {
  item: EditableOrderItem
}

// Props 声明
const props = defineProps<Props>()

// Emits 声明
const emit = defineEmits<{
  'update:item': [patch: EditableOrderItem]
  delete: [clientId: string]
}>()

// 方法
function handleNameInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:item', { ...props.item, name: value })
}

function handleQuantityInput(e: Event) {
  const value = Number((e.target as HTMLInputElement).value)
  emit('update:item', { ...props.item, quantity: value })
}

function handleUnitInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:item', { ...props.item, unit: value })
}

function handleDelete() {
  emit('delete', props.item.clientId)
}
</script>

<template>
  <view data-testid="order-item-row" class="order-item-row">
    <input
      data-testid="item-name"
      :value="props.item.name"
      placeholder="商品名称"
      class="order-item-row__input order-item-row__input--name"
      @input="handleNameInput"
    />
    <input
      data-testid="item-quantity"
      :value="String(props.item.quantity)"
      placeholder="数量"
      type="number"
      class="order-item-row__input order-item-row__input--qty"
      @input="handleQuantityInput"
    />
    <input
      data-testid="item-unit"
      :value="props.item.unit"
      placeholder="单位"
      class="order-item-row__input order-item-row__input--unit"
      @input="handleUnitInput"
    />
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
@use 'styles/variables' as *;

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

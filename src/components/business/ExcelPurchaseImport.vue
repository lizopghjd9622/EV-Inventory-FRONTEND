<template>
  <view class="excel-import">
    <!-- 触发入口卡片 -->
    <view
      class="excel-import__trigger"
      :class="{ 'excel-import__trigger--open': isOpen }"
      @click="toggleOpen"
    >
      <view class="excel-import__trigger-icon-wrap">
        <text class="excel-import__trigger-icon">📊</text>
      </view>
      <view class="excel-import__trigger-info">
        <text class="excel-import__trigger-title">Excel 批量导入</text>
        <text class="excel-import__trigger-desc">上传发车表，自动生成进货单</text>
      </view>
      <view class="excel-import__trigger-arrow" :class="{ 'excel-import__trigger-arrow--open': isOpen }">
        <text class="excel-import__trigger-arrow-icon">›</text>
      </view>
    </view>

    <!-- 展开面板 -->
    <view v-show="isOpen" class="excel-import__panel">
      <!-- 品牌输入 -->
      <view class="excel-import__section">
        <view class="excel-import__label-row">
          <text class="excel-import__label-required">*</text>
          <text class="excel-import__label">品牌名称</text>
        </view>
        <view class="excel-import__input-wrap" :class="{ 'excel-import__input-wrap--focused': brandFocused }">
          <text class="excel-import__input-prefix">🚗</text>
          <input
            v-model="brand"
            class="excel-import__input"
            placeholder="请输入品牌，如：特斯拉、比亚迪"
            placeholder-class="excel-import__placeholder"
            maxlength="20"
            @focus="brandFocused = true"
            @blur="brandFocused = false"
          />
        </view>
      </view>

      <!-- 上传区域 -->
      <view class="excel-import__section">
        <view class="excel-import__label-row">
          <text class="excel-import__label-required">*</text>
          <text class="excel-import__label">财务单文件</text>
          <text class="excel-import__label-hint">（.xlsx / .xls）</text>
        </view>

        <!-- 未选文件时 -->
        <view v-if="!selectedFileName" class="excel-import__upload-zone" @click="handlePickFile">
          <view class="excel-import__upload-icon-wrap">
            <text class="excel-import__upload-icon">📂</text>
          </view>
          <text class="excel-import__upload-text">点击选择 Excel 文件</text>
          <text class="excel-import__upload-sub">支持 .xlsx、.xls 格式</text>
        </view>

        <!-- 已选文件时 -->
        <view v-else class="excel-import__file-card">
          <view class="excel-import__file-icon-wrap">
            <text class="excel-import__file-icon">📋</text>
          </view>
          <view class="excel-import__file-info">
            <text class="excel-import__file-name">{{ selectedFileName }}</text>
            <text v-if="parsedRows.length > 0" class="excel-import__file-rows">
              共解析 {{ parsedRows.length }} 条有效记录
            </text>
          </view>
          <view class="excel-import__file-remove" @click="handleRemoveFile">
            <text class="excel-import__file-remove-icon">✕</text>
          </view>
        </view>

        <!-- 列格式说明 -->
        <view class="excel-import__format-hint">
          <text class="excel-import__format-hint-title">📌 Excel 列说明：</text>
          <view class="excel-import__format-cols">
            <view v-for="col in formatCols" :key="col.label" class="excel-import__format-col">
              <text class="excel-import__format-col-tag">{{ col.label }}</text>
              <text class="excel-import__format-col-desc">{{ col.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 警告信息 -->
      <view v-if="warnings.length > 0" class="excel-import__warnings">
        <view v-for="(w, i) in warnings" :key="i" class="excel-import__warning-item">
          <text class="excel-import__warning-icon">⚠️</text>
          <text class="excel-import__warning-text">{{ w }}</text>
        </view>
      </view>

      <!-- 预览列表 -->
      <view v-if="parsedRows.length > 0" class="excel-import__preview">
        <text class="excel-import__preview-title">数据预览（前 5 条）</text>
        <view class="excel-import__preview-table">
          <view class="excel-import__preview-thead">
            <text class="excel-import__preview-th excel-import__preview-th--name">商品名称</text>
            <text class="excel-import__preview-th">单价</text>
            <text class="excel-import__preview-th">数量</text>
          </view>
          <view
            v-for="(row, i) in previewRows"
            :key="i"
            class="excel-import__preview-tr"
            :class="{ 'excel-import__preview-tr--odd': i % 2 === 0 }"
          >
            <text class="excel-import__preview-td excel-import__preview-td--name">
              {{ buildItemName(row) }}
            </text>
            <text class="excel-import__preview-td">¥{{ row.unitPrice }}</text>
            <text class="excel-import__preview-td">{{ row.quantity }}台</text>
          </view>
        </view>
        <text v-if="parsedRows.length > 5" class="excel-import__preview-more">
          … 还有 {{ parsedRows.length - 5 }} 条
        </text>
        <!-- 汇总行 -->
        <view class="excel-import__preview-summary">
          <view class="excel-import__preview-summary-item">
            <text class="excel-import__preview-summary-label">总台数</text>
            <text class="excel-import__preview-summary-value">{{ totalQuantity }} 台</text>
          </view>
          <view class="excel-import__preview-summary-divider" />
          <view class="excel-import__preview-summary-item">
            <text class="excel-import__preview-summary-label">总金额</text>
            <text class="excel-import__preview-summary-value excel-import__preview-summary-value--amount">
              ¥{{ totalAmount.toLocaleString() }}
            </text>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="excel-import__actions">
        <view class="excel-import__cancel-btn" @click="handleClose">
          <text>收起</text>
        </view>
        <view
          class="excel-import__confirm-btn"
          :class="{ 'excel-import__confirm-btn--disabled': !canConfirm }"
          @click="handleConfirm"
        >
          <text>{{ confirming ? '创建中…' : `创建进货单（${parsedRows.length} 条）` }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { parsePurchaseExcel } from '@/utils/excelParser'
import type { ParsedPurchaseRow } from '@/utils/excelParser'

const emit = defineEmits<{
  (e: 'imported', items: Array<{ name: string; quantity: number; unit: string; cost: number }>): void
}>()

const isOpen = ref(false)
const brand = ref('')
const brandFocused = ref(false)
const selectedFileName = ref('')
const parsedRows = ref<ParsedPurchaseRow[]>([])
const warnings = ref<string[]>([])
const confirming = ref(false)

const formatCols = [
  { label: '车型', desc: '车款/型号' },
  { label: '颜色', desc: '外观颜色' },
  { label: '单价', desc: '进货含税单价' },
  { label: '发车数', desc: '此次出库台数' },
]

const previewRows = computed(() => parsedRows.value.slice(0, 5))

const totalQuantity = computed(() =>
  parsedRows.value.reduce((sum, r) => sum + r.quantity, 0),
)
const totalAmount = computed(() =>
  parsedRows.value.reduce((sum, r) => sum + r.totalAmount, 0),
)

const canConfirm = computed(
  () => brand.value.trim().length > 0 && parsedRows.value.length > 0 && !confirming.value,
)

function buildItemName(row: ParsedPurchaseRow): string {
  const parts = [brand.value.trim(), row.model, row.color].filter(Boolean)
  return parts.join(' ')
}

function toggleOpen() {
  isOpen.value = !isOpen.value
}

function handleClose() {
  isOpen.value = false
}

function handleRemoveFile() {
  selectedFileName.value = ''
  parsedRows.value = []
  warnings.value = []
}

async function handlePickFile() {
  // uni.chooseFile 仅支持 H5；微信小程序走 wx.chooseMessageFile
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    selectedFileName.value = file.name
    const buffer = await file.arrayBuffer()
    const result = parsePurchaseExcel(buffer)
    parsedRows.value = result.rows
    warnings.value = result.warnings
    if (result.rows.length === 0 && result.warnings.length === 0) {
      warnings.value = ['未解析到有效数据，请确认 Excel 格式是否正确']
    }
  }
  input.click()
  // #endif

  // #ifdef MP-WEIXIN
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  wx.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['xlsx', 'xls'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    success: (res: any) => {
      const file = res.tempFiles[0]
      selectedFileName.value = file.name
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const fs = wx.getFileSystemManager()
      fs.readFile({
        filePath: file.path,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        success: (readRes: any) => {
          const buffer = readRes.data as ArrayBuffer
          const result = parsePurchaseExcel(buffer)
          parsedRows.value = result.rows
          warnings.value = result.warnings
        },
        fail: () => {
          warnings.value = ['文件读取失败，请重试']
        },
      })
    },
  })
  // #endif
}

function handleConfirm() {
  if (!canConfirm.value) return
  confirming.value = true

  const items = parsedRows.value.map((row) => ({
    name: buildItemName(row),
    quantity: row.quantity,
    unit: '台',
    cost: row.unitPrice,
  }))

  emit('imported', items)

  // 重置状态
  setTimeout(() => {
    confirming.value = false
    isOpen.value = false
    handleRemoveFile()
    brand.value = ''
  }, 300)
}
</script>

<style lang="scss" scoped>
.excel-import {
  width: 100%;

  // ── 触发卡片 ──────────────────────────────────────
  &__trigger {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 28rpx 36rpx;
    background: #fff;
    border-radius: 24rpx;
    box-shadow: 0 4rpx 24rpx rgba(0, 120, 94, 0.08);
    border: 2rpx solid #e0f5ed;
    cursor: pointer;
    transition: box-shadow 0.2s, background 0.2s;

    &:active {
      box-shadow: 0 2rpx 8rpx rgba(0, 120, 94, 0.15);
    }

    &--open {
      border-radius: 24rpx 24rpx 0 0;
      border-bottom-color: transparent;
      background: #f0fff9;
    }
  }

  &__trigger-icon-wrap {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    background: linear-gradient(135deg, #17c98e 0%, #00796b 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 6rpx 20rpx rgba(0, 184, 148, 0.25);
  }

  &__trigger-icon {
    font-size: 40rpx;
  }

  &__trigger-info {
    flex: 1;
  }

  &__trigger-title {
    display: block;
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 6rpx;
  }

  &__trigger-desc {
    display: block;
    font-size: 24rpx;
    color: #999;
  }

  &__trigger-arrow {
    width: 40rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s;

    &--open {
      transform: rotate(90deg);
    }
  }

  &__trigger-arrow-icon {
    font-size: 40rpx;
    color: #ccc;
    font-weight: 300;
  }

  // ── 展开面板 ─────────────────────────────────────
  &__panel {
    background: #fff;
    border: 2rpx solid #e0f5ed;
    border-top: none;
    border-radius: 0 0 24rpx 24rpx;
    padding: 8rpx 0 4rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 120, 94, 0.08);
  }

  // ── Section ──────────────────────────────────────
  &__section {
    padding: 0 40rpx 32rpx;
  }

  &__label-row {
    display: flex;
    align-items: center;
    gap: 6rpx;
    margin-bottom: 16rpx;
  }

  &__label-required {
    font-size: 28rpx;
    color: #ff4d4f;
    line-height: 1;
  }

  &__label {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
  }

  &__label-hint {
    font-size: 24rpx;
    color: #bbb;
  }

  // ── 品牌输入框 ─────────────────────────────────────
  &__input-wrap {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx 28rpx;
    border-radius: 20rpx;
    border: 2rpx solid #e5e5e5;
    background: #fafafa;
    transition: border-color 0.2s, box-shadow 0.2s;

    &--focused {
      border-color: #00b894;
      box-shadow: 0 0 0 6rpx rgba(0, 184, 148, 0.1);
      background: #fff;
    }
  }

  &__input-prefix {
    font-size: 32rpx;
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    font-size: 30rpx;
    color: #222;
    background: transparent;
  }

  // #ifdef H5
  &__placeholder {
    color: #c0c0c0;
  }
  // #endif

  // ── 上传区域 ──────────────────────────────────────
  &__upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 48rpx 32rpx;
    border-radius: 20rpx;
    border: 3rpx dashed #b7edd0;
    background: #f7fffe;
    cursor: pointer;

    &:active {
      background: #edfaf5;
    }
  }

  &__upload-icon-wrap {
    width: 88rpx;
    height: 88rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #b7edd0 0%, #74d7b3 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__upload-icon {
    font-size: 44rpx;
  }

  &__upload-text {
    font-size: 30rpx;
    font-weight: 600;
    color: #00796b;
  }

  &__upload-sub {
    font-size: 24rpx;
    color: #aaa;
  }

  // ── 已选文件卡片 ──────────────────────────────────
  &__file-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 24rpx 28rpx;
    border-radius: 20rpx;
    background: #f0fff4;
    border: 2rpx solid #b7edd0;
  }

  &__file-icon-wrap {
    width: 72rpx;
    height: 72rpx;
    border-radius: 16rpx;
    background: #00b894;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__file-icon {
    font-size: 36rpx;
  }

  &__file-info {
    flex: 1;
    min-width: 0;
  }

  &__file-name {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__file-rows {
    display: block;
    font-size: 24rpx;
    color: #00796b;
    margin-top: 4rpx;
  }

  &__file-remove {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
  }

  &__file-remove-icon {
    font-size: 22rpx;
    color: #888;
  }

  // ── 格式说明 ──────────────────────────────────────
  &__format-hint {
    margin-top: 20rpx;
    padding: 20rpx 24rpx;
    border-radius: 16rpx;
    background: #fffbe6;
    border: 1rpx solid #ffe58f;
  }

  &__format-hint-title {
    display: block;
    font-size: 24rpx;
    color: #ad6800;
    margin-bottom: 12rpx;
    font-weight: 600;
  }

  &__format-cols {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
  }

  &__format-col {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__format-col-tag {
    font-size: 22rpx;
    color: #fff;
    background: #fa8c16;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    font-weight: 600;
  }

  &__format-col-desc {
    font-size: 22rpx;
    color: #8c6400;
  }

  // ── 警告 ──────────────────────────────────────────
  &__warnings {
    margin: 0 40rpx 24rpx;
    padding: 20rpx 24rpx;
    border-radius: 16rpx;
    background: #fff7e6;
    border: 1rpx solid #ffd591;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__warning-item {
    display: flex;
    align-items: flex-start;
    gap: 8rpx;
  }

  &__warning-icon {
    font-size: 24rpx;
    flex-shrink: 0;
  }

  &__warning-text {
    font-size: 24rpx;
    color: #ad6800;
    line-height: 1.5;
  }

  // ── 预览表格 ──────────────────────────────────────
  &__preview {
    margin: 0 40rpx 24rpx;
    border-radius: 16rpx;
    overflow: hidden;
    border: 1rpx solid #e5e5e5;
  }

  &__preview-title {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: #555;
    padding: 16rpx 24rpx;
    background: #fafafa;
    border-bottom: 1rpx solid #e5e5e5;
  }

  &__preview-thead {
    display: flex;
    background: #f0f0f0;
    padding: 12rpx 24rpx;
  }

  &__preview-th {
    flex: 1;
    font-size: 22rpx;
    color: #888;
    font-weight: 600;
    text-align: center;

    &--name {
      flex: 3;
      text-align: left;
    }
  }

  &__preview-tr {
    display: flex;
    padding: 14rpx 24rpx;
    background: #fff;

    &--odd {
      background: #f9f9f9;
    }
  }

  &__preview-td {
    flex: 1;
    font-size: 24rpx;
    color: #333;
    text-align: center;

    &--name {
      flex: 3;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__preview-more {
    display: block;
    font-size: 22rpx;
    color: #aaa;
    text-align: center;
    padding: 10rpx 0;
    background: #fafafa;
    border-top: 1rpx solid #e5e5e5;
  }

  &__preview-summary {
    display: flex;
    align-items: center;
    padding: 20rpx 24rpx;
    background: #f0fff9;
    border-top: 1rpx solid #b7edd0;
  }

  &__preview-summary-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rpx;
  }

  &__preview-summary-label {
    font-size: 22rpx;
    color: #888;
  }

  &__preview-summary-value {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;

    &--amount {
      color: #00796b;
    }
  }

  &__preview-summary-divider {
    width: 1rpx;
    height: 44rpx;
    background: #b7edd0;
    margin: 0 16rpx;
  }

  // ── 底部按钮 ──────────────────────────────────────
  &__actions {
    display: flex;
    gap: 20rpx;
    padding: 24rpx 40rpx 0;
  }

  &__cancel-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
    border: 2rpx solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    color: #666;
    background: #fff;

    &:active {
      background: #f5f5f5;
    }
  }

  &__confirm-btn {
    flex: 2;
    height: 88rpx;
    border-radius: 44rpx;
    background: linear-gradient(135deg, #17c98e 0%, #00796b 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    color: #fff;
    font-weight: 700;
    box-shadow: 0 8rpx 24rpx rgba(0, 184, 148, 0.35);

    &:active {
      opacity: 0.85;
    }

    &--disabled {
      background: #ccc;
      box-shadow: none;
      pointer-events: none;
    }
  }
}
</style>

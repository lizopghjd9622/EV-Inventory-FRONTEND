import * as XLSX from 'xlsx'

/** Excel 解析出的单行进货数据 */
export interface ParsedPurchaseRow {
  /** 车型 */
  model: string
  /** 颜色 */
  color: string
  /** 单价 */
  unitPrice: number
  /** 发车数（数量） */
  quantity: number
  /** 总价（优先取 Excel 总价列，否则为 unitPrice × quantity） */
  totalAmount: number
}

/** 列匹配关键词 */
const MODEL_KEYS = ['车型', '型号', '车款', '规格', 'model']
const COLOR_KEYS = ['颜色', '外观', '外观颜色', '色', 'color']
const PRICE_KEYS = ['单价', '出厂价', '进价', '价格', '含税单价', 'price']
const QUANTITY_KEYS = ['发车数', '发车量', '数量', '出库数', '出库量', '台数', 'qty', 'quantity']
const TOTAL_KEYS = ['总价', '合计', '含税金额', '总金额', '金额', 'amount', 'total']

/** 不区分大小写、去除空格地模糊匹配列名 */
function findKey(headers: string[], candidates: string[]): string | undefined {
  return headers.find((h) => {
    const normalized = h.trim().toLowerCase()
    return candidates.some((c) => normalized.includes(c.toLowerCase()))
  })
}

/**
 * 从 ArrayBuffer（xlsx/xls 文件内容）中解析进货数据
 * 自动识别第一张 Sheet 中的 车型 / 颜色 / 单价 / 发车数 列
 */
export function parsePurchaseExcel(data: ArrayBuffer): {
  rows: ParsedPurchaseRow[]
  warnings: string[]
} {
  const warnings: string[] = []

  const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { rows: [], warnings: ['Excel 文件没有可用的 Sheet'] }
  }

  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  })

  if (rawRows.length === 0) {
    return { rows: [], warnings: ['Sheet 中没有数据行'] }
  }

  const headers = Object.keys(rawRows[0])

  const modelKey = findKey(headers, MODEL_KEYS)
  const colorKey = findKey(headers, COLOR_KEYS)
  const priceKey = findKey(headers, PRICE_KEYS)
  const quantityKey = findKey(headers, QUANTITY_KEYS)
  const totalKey = findKey(headers, TOTAL_KEYS)

  if (!modelKey) warnings.push('未找到"车型"列，商品名称将不含车型信息')
  if (!colorKey) warnings.push('未找到"颜色"列，商品名称将不含颜色信息')
  if (!priceKey) warnings.push('未找到"单价"列，单价将默认为 0')
  if (!quantityKey) warnings.push('未找到"发车数"列，数量将默认为 0')

  const rows: ParsedPurchaseRow[] = rawRows
    .map((row) => {
      const unitPrice = priceKey
        ? parseFloat(String(row[priceKey]).replace(/[^0-9.]/g, '')) || 0
        : 0
      const quantity = quantityKey
        ? parseInt(String(row[quantityKey]).replace(/[^0-9]/g, ''), 10) || 0
        : 0
      const totalAmount = totalKey
        ? parseFloat(String(row[totalKey]).replace(/[^0-9.]/g, '')) || unitPrice * quantity
        : unitPrice * quantity
      return {
        model: modelKey ? String(row[modelKey] ?? '').trim() : '',
        color: colorKey ? String(row[colorKey] ?? '').trim() : '',
        unitPrice,
        quantity,
        totalAmount,
      }
    })
    // 过滤掉发车数为 0 的行（空行或无效行）
    .filter((r) => r.quantity > 0)

  return { rows, warnings }
}

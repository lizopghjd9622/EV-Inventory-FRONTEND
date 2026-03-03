# 开发规约（微信小程序前端版）

规定了团队协作的基本原则和代码规范，适用于 uni-app + Vue 3 + TypeScript 技术栈。
参与开发的成员都应遵循这些规约，确保团队协作的高效和一致性。

## 目录结构规范

```
src/
├── assets/           # 静态资源（图片、字体等）
├── components/       # 全局公共组件
│   ├── base/         # 基础 UI 组件（Button、Input 等）
│   └── business/     # 业务公共组件
├── composables/      # Vue 3 组合式函数（use* 命名）
├── constants/        # 常量与枚举定义
├── pages/            # 页面文件（与 pages.json 对应）
│   └── [module]/     # 按业务模块组织
├── platform/         # 平台差异化代码
│   ├── mp-weixin/    # 微信小程序专用
│   └── h5/           # H5 专用
├── services/         # API 请求服务层
│   └── [module]/     # 按业务模块组织
├── stores/           # Pinia 状态管理
├── types/            # TypeScript 类型定义
│   ├── api/          # 后端接口类型
│   └── models/       # 业务模型类型
└── utils/            # 工具函数
```

## 编程规约

### 基础规范

1. **代码风格**：使用 ESLint + Prettier 统一代码格式，配置基于 `@antfu/eslint-config`。
2. **TypeScript**：开启 strict 模式，所有文件必须有明确类型，禁止使用 `any`。
3. **注释语言**：所有注释、JSDoc 文档字符串使用中文，确保团队一致性。
4. **文件编码**：统一使用 UTF-8，LF 换行符。

### Vue 组件规范

#### 组件文件结构

组件统一使用 `<script setup lang="ts">` 语法，结构顺序如下：

```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed } from 'vue'
import type { PropType } from 'vue'

// 2. Props 类型定义
interface Props {
  title: string
  items: InventoryItem[]
  loading?: boolean
}

// 3. Props 声明
const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// 4. Emits 声明
const emit = defineEmits<{
  select: [item: InventoryItem]
  refresh: []
}>()

// 5. 响应式状态
const isExpanded = ref(false)

// 6. 计算属性
const filteredItems = computed(() => props.items.filter(/* ... */))

// 7. Composables 调用
const { loading: fetchLoading } = useInventoryList()

// 8. 方法
function handleSelect(item: InventoryItem) {
  emit('select', item)
}

// 9. 生命周期钩子
onMounted(() => {
  // ...
})
</script>

<template>
  <!-- 模板内容 -->
</template>

<style lang="scss" scoped>
/* 样式 */
</style>
```

#### 组件命名规范

| 场景 | 规范 | 示例 |
| ---- | ---- | ---- |
| 组件文件名 | PascalCase | `InventoryCard.vue` |
| 组件注册名 | PascalCase | `InventoryCard` |
| 基础组件前缀 | `Base` | `BaseButton.vue` |
| 业务组件 | 业务名+功能 | `InventoryFilterBar.vue` |
| 页面组件 | 按 uni-app 约定 | `pages/inventory/index.vue` |

#### Props 规范

```typescript
// ✅ 正确：使用 TypeScript interface 声明
interface Props {
  vehicleId: string
  status: VehicleStatus
  onSale?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  onSale: false,
})

// ❌ 错误：使用运行时 PropType 替代 TS 类型
const props = defineProps({
  vehicleId: { type: String, required: true },
})
```

### Composable 规范

所有 composable 以 `use` 开头，封装单一关注点：

```typescript
// composables/useInventoryList.ts
import { ref, onMounted } from 'vue'
import type { InventoryItem, InventoryListQuery } from '@/types/api/inventory'
import { fetchInventoryList } from '@/services/inventory'

/**
 * 库存列表数据获取与分页管理
 */
export function useInventoryList(query?: Ref<InventoryListQuery>) {
  const list = ref<InventoryItem[]>([])
  const loading = ref(false)
  const finished = ref(false)
  const page = ref(1)

  async function loadMore() {
    if (loading.value || finished.value) return
    loading.value = true
    try {
      const res = await fetchInventoryList({ ...query?.value, page: page.value })
      list.value.push(...res.items)
      finished.value = res.items.length < res.pageSize
      page.value++
    } finally {
      loading.value = false
    }
  }

  onMounted(loadMore)

  return { list, loading, finished, loadMore }
}
```

## 状态管理规约（Pinia）

### Store 结构规范

每个业务域对应一个独立 store 文件，使用 Setup Store 风格（`defineStore` + Composition API）：

```typescript
// stores/inventory.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { InventoryItem } from '@/types/models/inventory'

export const useInventoryStore = defineStore('inventory', () => {
  // State
  const selectedVehicleId = ref<string | null>(null)
  const filterConditions = ref<FilterConditions>({})

  // Getters
  const hasFilter = computed(() =>
    Object.values(filterConditions.value).some(Boolean)
  )

  // Actions
  function selectVehicle(id: string) {
    selectedVehicleId.value = id
  }

  function clearFilter() {
    filterConditions.value = {}
  }

  return { selectedVehicleId, filterConditions, hasFilter, selectVehicle, clearFilter }
})
```

### Store 使用规范

- **禁止**在 `setup()` 外直接修改 store 状态（如顶层脚本、事件回调外）
- **必须**通过 actions 修改状态，不直接赋值 `store.xxx = yyy`（setup store 内部除外）
- **跨组件共享**的状态放 store；**页面内部**的临时状态用 `ref`/`reactive`

## 网络请求规约（luch-request）

### 请求服务层结构

```typescript
// services/inventory/index.ts
import request from '@/utils/request'
import type { InventoryListQuery, InventoryListResponse } from '@/types/api/inventory'

/**
 * 获取车辆库存列表
 */
export function fetchInventoryList(query: InventoryListQuery) {
  return request.get<InventoryListResponse>('/api/inventory/list', { params: query })
}

/**
 * 更新车辆状态
 */
export function updateVehicleStatus(vehicleId: string, status: VehicleStatus) {
  return request.patch<void>(`/api/inventory/${vehicleId}/status`, { status })
}
```

### 请求拦截器配置

```typescript
// utils/request.ts
import Request from 'luch-request'
import { useAuthStore } from '@/stores/auth'

const request = new Request({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

request.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.header = { ...config.header, Authorization: `Bearer ${authStore.token}` }
  }
  return config
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.statusCode === 401) {
      // 统一处理登录态过期
      uni.navigateTo({ url: '/pages/login/index' })
    }
    return Promise.reject(error)
  }
)

export default request
```

## 样式规约

### 尺寸单位

```scss
// ✅ 正确：使用 rpx（小程序端，H5 端由 postcss 自动转换）
.container {
  padding: 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
}

// ✅ 例外：边框使用 1px（物理像素）
.card {
  border: 1px solid #e5e7eb;
}

// ❌ 错误：布局中使用 px
.container {
  padding: 12px; // 禁止
}
```

### 文件组织

- 全局样式：`src/styles/index.scss`（变量、mixins、reset）
- 主题变量：`src/styles/variables.scss`（颜色、字号等设计 token）
- 组件样式：使用 `<style lang="scss" scoped>` 避免样式污染

### 颜色与间距

所有颜色和间距使用 `src/styles/variables.scss` 中定义的 CSS 变量，禁止在组件中硬编码颜色值。

```scss
// ✅ 正确
.title {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

// ❌ 错误
.title {
  color: #333333;
  margin-bottom: 16rpx;
}
```

## TypeScript 规约

### 类型定义规范

```typescript
// ✅ 对象结构使用 interface
interface VehicleInfo {
  id: string
  vin: string
  brand: string
  model: string
  status: VehicleStatus
  price: number
}

// ✅ 联合类型/工具类型使用 type
type VehicleStatus = 'available' | 'reserved' | 'sold' | 'transit'
type PartialVehicle = Partial<VehicleInfo>

// ✅ 枚举用于有限的命名常量集合
enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}
```

### API 类型同步规范

```typescript
// src/types/api/inventory.ts
// 请求参数类型
export interface InventoryListQuery {
  brand?: string
  status?: VehicleStatus
  page: number
  pageSize: number
}

// 响应体类型（与后端 schema 保持一致）
export interface InventoryListResponse {
  items: InventoryItem[]
  total: number
  page: number
  pageSize: number
}

// 后端返回的原始数据结构
export interface InventoryItem {
  id: string
  vin: string
  brand: string
  model: string
  colorExterior: string
  price: number
  status: VehicleStatus
  arrivedAt: string // ISO 8601
}
```

## 平台差异处理规约

### 条件编译使用规则

仅在以下三处使用条件编译，禁止在业务逻辑中散落：

1. **`src/platform/`** 目录：平台专属工具函数
2. **组件模板**内：需要差异化渲染的 UI 块
3. **`uni.xxx` API 调用处**：当同等 API 在 H5 不可用时

```vue
<template>
  <!-- ✅ 平台差异 UI 放在组件模板的条件编译块中 -->
  <!-- #ifdef MP-WEIXIN -->
  <button open-type="getUserInfo">微信授权</button>
  <!-- #endif -->
  <!-- #ifdef H5 -->
  <button @click="handleH5Login">账号登录</button>
  <!-- #endif -->
</template>
```

## 命名规范汇总

| 对象 | 规范 | 示例 |
| ---- | ---- | ---- |
| 组件文件 | PascalCase | `InventoryCard.vue` |
| Composable 文件 | camelCase，`use` 前缀 | `useInventoryList.ts` |
| Store 文件 | camelCase | `inventory.ts` |
| Service 文件 | camelCase 或 `index.ts` | `inventory/index.ts` |
| 变量/函数 | camelCase | `vehicleList`, `handleSelect` |
| 常量/枚举值 | SCREAMING_SNAKE_CASE | `MAX_PAGE_SIZE` |
| TypeScript 接口 | PascalCase | `InventoryItem` |
| CSS 类名 | kebab-case | `.inventory-card` |
| 事件名 | camelCase | `emit('itemSelect', item)` |

## 特别注意

- 所有注释、文档字符串和日志中的解释描述性文字都应该使用**中文**，确保团队成员能够理解和维护代码。
- 除非需要延迟导入，否则所有 `import` 都应该放在文件顶部。
- 禁止提交包含 `console.log` 的代码到主分支，调试日志需在 PR 合并前清理。

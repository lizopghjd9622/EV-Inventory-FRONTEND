# 测试规约（微信小程序前端版）

TDD（测试驱动开发）是我们项目的核心开发流程。复杂业务逻辑、工具函数和 composable 的开发必须遵循 TDD 流程：**红-绿-重构**。

## 核心原则

**基于状态验证，而非行为验证**

- 测试应该验证"发生了什么"（状态变化、UI 渲染结果），而不是"如何发生的"（方法调用顺序）
- 验证 composable 的返回值、组件的 DOM 输出、store 的状态变化
- 禁止以 `spyOn` / `vi.fn()` 的调用次数作为主要断言（可以辅助验证，但不能是唯一断言）

## 测试框架与工具

| 工具 | 用途 |
| ---- | ---- |
| **Vitest** | 单元测试 + 组件测试的测试运行器 |
| **@vue/test-utils** | Vue 组件挂载与交互模拟 |
| **jsdom** | Vitest 的 DOM 环境（组件测试） |
| **vi (Vitest)** | Mock、Spy、Fake Timer |

配置示例（`vitest.config.ts`）：

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
```

## 测试分层

```
tests/
├── unit/              # 单元测试：纯函数、工具函数
├── composables/       # Composable 测试：Vue 组合式函数
├── components/        # 组件测试：UI 组件交互与渲染
└── stores/            # Store 测试：Pinia store 逻辑
```

**目录结构与 `src/` 保持镜像**，如：`tests/composables/useInventoryList.test.ts`

## 测试策略

按分层架构，各层对应的测试策略：

| 层次 | 测试类型 | 说明 |
| ---- | -------- | ---- |
| **工具函数** (`utils/`) | 单元测试 | 纯函数，输入/输出验证 |
| **Composables** | Composable 测试 | 使用 `withSetup` 或 `@vueuse/test-utils` 包装测试 |
| **Pinia Store** | 单元测试 | 测试 actions 执行后的 state 变化 |
| **展示型组件** | 组件测试 | 验证 props 输入 → DOM 输出 |
| **容器型组件** | 组件测试 | Mock 依赖（store/API），验证交互行为 |
| **页面** | 轻量集成测试 | Mock API + Store，关键用户流程验证 |

## Mock 使用规则

| 需要 Mock 的对象 | 方式 | 说明 |
| ---------------- | ---- | ---- |
| luch-request / API 调用 | `vi.mock('@/utils/request')` | 拦截网络请求 |
| uni 小程序 API | `vi.stubGlobal('uni', mockUni)` | 模拟 `uni.navigateTo` 等 |
| 第三方库 | `vi.mock('library-name')` | 按需模拟 |
| 定时器 | `vi.useFakeTimers()` | 控制时间相关逻辑 |

**核心区别**：

- **Mock**: 替代外部依赖，让测试可以独立运行（不发真实网络请求）
- **Spy**: 监听函数调用，用于辅助验证（不作为唯一断言）
- **Fake**: 用于验证传入参数或结果状态的替代实现

## Composable 测试规范

使用辅助工具在 Vue 应用上下文中测试 composable：

```typescript
// tests/composables/useInventoryList.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import { useInventoryList } from '@/composables/useInventoryList'
import * as inventoryService from '@/services/inventory'

// 用挂载辅助组件的方式测试 composable
function mountComposable<T>(composable: () => T) {
  let result!: T
  mount(
    defineComponent({
      setup() {
        result = composable()
        return () => h('div')
      },
    }),
    { global: { plugins: [createTestingPinia()] } }
  )
  return result
}

describe('useInventoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('初始状态下 list 应为空，loading 为 false', () => {
    // Given
    vi.spyOn(inventoryService, 'fetchInventoryList').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    })

    // When
    const { list, loading } = mountComposable(useInventoryList)

    // Then：验证初始状态
    expect(list.value).toEqual([])
    expect(loading.value).toBe(false)
  })

  it('loadMore 执行后应追加数据到 list', async () => {
    // Given
    const mockItems = [{ id: '1', vin: 'LSGP214SXLH123456' /* ... */ }]
    vi.spyOn(inventoryService, 'fetchInventoryList').mockResolvedValue({
      items: mockItems,
      total: 1,
      page: 1,
      pageSize: 20,
    })
    const { list, loadMore } = mountComposable(useInventoryList)

    // When
    await loadMore()

    // Then：验证状态（返回值）
    expect(list.value).toHaveLength(1)
    expect(list.value[0].id).toBe('1')
  })
})
```

## 组件测试规范

### 基本规则

1. **使用 `@vue/test-utils` 的 `mount`**：避免 `shallowMount`，优先测试真实渲染结果
2. **Mock 外部依赖**：API 请求、uni 平台 API、全局 store 使用 `createTestingPinia`
3. **通过 DOM 断言**：验证用户可见的结果，而非组件内部实现

### 标准组件测试结构

```typescript
// tests/components/InventoryCard.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import InventoryCard from '@/components/business/InventoryCard.vue'
import type { InventoryItem } from '@/types/models/inventory'

const mockVehicle: InventoryItem = {
  id: 'v001',
  vin: 'LSGP214SXLH123456',
  brand: '特斯拉',
  model: 'Model 3',
  colorExterior: '珍珠白',
  price: 259900,
  status: 'available',
  arrivedAt: '2026-01-15T00:00:00Z',
}

describe('InventoryCard', () => {
  it('应正确渲染车辆基本信息', () => {
    // Given & When
    const wrapper = mount(InventoryCard, {
      props: { vehicle: mockVehicle },
      global: { plugins: [createTestingPinia()] },
    })

    // Then：验证 DOM 状态
    expect(wrapper.find('[data-testid="vehicle-brand"]').text()).toBe('特斯拉 Model 3')
    expect(wrapper.find('[data-testid="vehicle-price"]').text()).toContain('259,900')
  })

  it('点击选择按钮后应触发 select 事件', async () => {
    // Given
    const wrapper = mount(InventoryCard, {
      props: { vehicle: mockVehicle },
      global: { plugins: [createTestingPinia()] },
    })

    // When
    await wrapper.find('[data-testid="select-btn"]').trigger('click')

    // Then：验证事件 payload（状态验证）
    const selectEvents = wrapper.emitted('select')
    expect(selectEvents).toHaveLength(1)
    expect(selectEvents![0][0]).toEqual(mockVehicle)
  })
})
```

## Pinia Store 测试规范

```typescript
// tests/stores/inventory.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInventoryStore } from '@/stores/inventory'

describe('useInventoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('selectVehicle 后 selectedVehicleId 应更新', () => {
    // Given
    const store = useInventoryStore()
    expect(store.selectedVehicleId).toBeNull()

    // When
    store.selectVehicle('v001')

    // Then
    expect(store.selectedVehicleId).toBe('v001')
  })

  it('clearFilter 后 hasFilter 应为 false', () => {
    // Given
    const store = useInventoryStore()
    store.filterConditions = { brand: '比亚迪' }
    expect(store.hasFilter).toBe(true)

    // When
    store.clearFilter()

    // Then
    expect(store.hasFilter).toBe(false)
  })
})
```

## 命名规范

- 测试文件：`<模块名>.test.ts`（与源文件同名）
- 测试套件（`describe`）：`<组件/函数名>`
- 测试用例（`it`）：`<操作/场景> 应/后 <预期结果>`（中文，清晰描述意图）

## Given-When-Then 格式

所有测试使用 Given-When-Then 格式组织，用注释明确标注三段：

```typescript
it('库存为空时加载更多应将 finished 置为 true', async () => {
  // Given：空库存响应
  vi.spyOn(inventoryService, 'fetchInventoryList').mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  })
  const { finished, loadMore } = mountComposable(useInventoryList)

  // When：触发加载
  await loadMore()

  // Then：验证结束状态
  expect(finished.value).toBe(true)
})
```

## 测试辅助工具（`tests/setup.ts`）

```typescript
// tests/setup.ts
import { vi } from 'vitest'

// Mock uni 全局对象（小程序 API）
const mockUni = {
  navigateTo: vi.fn(),
  showToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  getStorageSync: vi.fn(() => ''),
  setStorageSync: vi.fn(),
}

vi.stubGlobal('uni', mockUni)

// 每个测试后重置所有 mock
afterEach(() => {
  vi.clearAllMocks()
})
```

## 代码示例：状态验证 vs 行为验证

### ✅ 正确：状态验证

```typescript
it('应在筛选条件变化时重新请求数据', async () => {
  // Given
  const fetchSpy = vi.spyOn(inventoryService, 'fetchInventoryList').mockResolvedValue({
    items: [mockItem],
    total: 1,
    page: 1,
    pageSize: 20,
  })
  const { list, setFilter } = mountComposable(useInventoryList)

  // When
  await setFilter({ brand: '比亚迪' })

  // Then：验证状态结果（list 内容），而非 fetchSpy 调用次数
  expect(list.value[0].brand).toBe('比亚迪') // ✅ 状态验证
})
```

### ❌ 错误：行为验证（禁止作为唯一断言）

```typescript
it('应调用 fetchInventoryList', async () => {
  const fetchSpy = vi.spyOn(inventoryService, 'fetchInventoryList')
  const { setFilter } = mountComposable(useInventoryList)

  await setFilter({ brand: '比亚迪' })

  // ❌ 仅验证调用次数，不验证结果状态
  expect(fetchSpy).toHaveBeenCalledTimes(1) // 单独使用时禁止
})
```

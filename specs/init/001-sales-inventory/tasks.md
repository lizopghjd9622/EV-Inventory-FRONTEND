# 智能销售库存系统 — 任务列表

> 基于 spec.md v2.0.0 & plan.md v1.0.0 拆解  
> 遵循 constitution.md：测试先行、单一职责、依赖最小化

---

## 阶段 P：前置 — 项目冷启动（原始缺失，补充）

> **这是让页面能跑起来的必要前提**，阶段 0 所有任务依赖本阶段全部完成。

- [x] TP1 运行脚手架命令：`npx degit dcloudio/uni-preset-vue#vite-ts my-app && cd my-app`，确认生成 `package.json`、`vite.config.ts`、`tsconfig.json`、`index.html`、`src/main.ts`、`src/App.vue`
- [x] TP2 安装所有依赖：`npm install`；追加运行时依赖 `npm install uview-plus pinia luch-request dayjs`；追加开发依赖 `npm install -D vitest @vue/test-utils @vitest/coverage-v8 sass happy-dom eslint prettier stylelint lint-staged husky`
- [x] TP3 修改 `src/main.ts`：创建 Vue app，注册 Pinia（`createPinia()`），注册 uview-plus（`app.use(uviewPlus)`），最后 `app.mount('#app')`
- [x] TP4 创建 `.env.example`（写入 `VITE_API_BASE_URL=http://localhost:8000`）和 `.env.local`（本地真实后端地址），将 `.env.local` 加入 `.gitignore`
- [x] TP5 验证冷启动：运行 `npm run dev:h5`，确认浏览器能打开页面（允许白屏，只要无编译报错）

---

## 阶段 0：项目脚手架与工程配置

> 所有用户故事开始前必须完成的工程基础设施。阶段 P 完成后方可开始。

- [x] T001 配置 `vite.config.ts`：注册 `@dcloudio/vite-plugin-uni`，配置路径别名 `@` → `src/`，配置 Vitest（`test.environment = 'happy-dom'`，`coverage.provider = 'v8'`）
- [x] T002 配置 `tsconfig.json`：确认 `strict: true`，添加 `@` 路径别名 `paths` 映射，引入 `@dcloudio/types/uni-app` 类型声明
- [x] T003 配置 `.eslintrc.cjs` + `.prettierrc` + `stylelint.config.js`，配置 `lint-staged`（`.lintstagedrc`）+ `husky` pre-commit 钩子（`npx husky install`）
- [x] T004 配置 `pages.json`：注册 `pages/login/index`、`pages/home/index`、`pages/order-detail/index` 三个页面，设置 tabBar-less 路由及 navigationBar 样式
- [x] T005 [P] 创建 `src/styles/variables.scss`：定义颜色、间距、圆角等设计 token（CSS 变量），供全局引用
- [x] T004 [P] 创建 `src/styles/index.scss`：引入 variables、reset 样式，并注册为 Vite 全局样式
- [x] T005 [P] 创建 `src/constants/index.ts`：定义 `MAX_RECORD_SECONDS = 60`、`OrderType`、`SseEventType`、`RecordStatus` 枚举
- [x] T006 [P] 创建 `src/types/api/auth.ts`：定义 `LoginRequest`、`LoginResponse` 接口
- [x] T007 [P] 创建 `src/types/api/order.ts`：定义 `SalesItemDto`、`SalesOrderDto`、`PurchaseItemDto`、`PurchaseOrderDto`、`SseExtractedPayload`、`SseOrderCreatedPayload`、`SseErrorPayload` 接口
- [x] T008 [P] 创建 `src/types/models/order.ts`：定义 `EditableOrderItem`、`VoiceOrderSession` 前端业务模型接口
- [x] T009 创建 `src/utils/request.ts`：初始化 luch-request 实例，配置 `baseURL`（读取 `VITE_API_BASE_URL`）、`timeout`，添加请求拦截器（注入 Bearer Token）和响应拦截器（401 → logout + reLaunch）
- [x] T010 创建 `src/stores/__tests__/auth.test.ts`：编写 `useAuthStore` 的单元测试——涵盖 `setToken`（持久化断言）、`logout`（清除 token）、`isLoggedIn` 计算属性
- [x] T011 实现 `src/stores/auth.ts`：通过 T010 全部测试
- [x] T012 创建 `src/stores/__tests__/voiceOrder.test.ts`：编写 `useVoiceOrderStore` 的单元测试——涵盖 `initSession`、`setAudioBlob`、`appendItem`、`updateItem`、`deleteItem`、`setError`（验证 audioBlob 保留）
- [x] T013 实现 `src/stores/voiceOrder.ts`：通过 T012 全部测试

---

## 阶段 1：US1 — 登录

> 目标：用户能以手机号+密码登录，Token 持久化，未登录自动拦截跳转。

- [x] T014 [US1] 创建 `src/utils/__tests__/routeGuard.test.ts`：测试 `requireAuth()`——已登录时 `reLaunch` 不被调用；未登录时 `reLaunch` 被调用跳转 `/pages/login/index`
- [x] T015 [US1] 实现 `src/utils/routeGuard.ts`：通过 T014 全部测试
- [x] T016 [US1] 创建 `src/services/auth/__tests__/index.test.ts`：mock luch-request，测试 `login(data)` 组装正确的 POST 请求体和路径 `/auth/login`
- [x] T017 [US1] 实现 `src/services/auth/index.ts`：封装 `login(data: LoginRequest)` 调用，通过 T016 全部测试
- [x] T018 [P] [US1] 创建 `src/components/base/BaseInput.vue`：封装 uni-app input，支持 `v-model`、`placeholder`、`type`（text/password/number）、`error` Props，error 为 true 时展示红色下边框+错误文案 slot
- [x] T019 [P] [US1] 创建 `src/components/base/BaseButton.vue`：封装 uni-app button，支持 `label`、`loading`、`disabled`、`type`（primary/default）Props，loading 时展示 `<u-loading-icon>`
- [x] T020 [US1] 创建 `src/components/business/CaptchaBlock.vue`：接收 Props `visible: boolean`，`imageUrl: string`；条件渲染验证码图片（点击刷新 emit `refresh`）和 `BaseInput`（emit `update:value`）
- [x] T021 [US1] 创建 `src/pages/login/index.vue`：组装表单（手机号、密码、`CaptchaBlock`、登录按钮），实现以下完整逻辑：
  - 手机号正则校验，错误时 BaseInput 展示红色提示
  - 点击登录调用 `authStore` + `login` service，成功 → `uni.reLaunch('/pages/home/index')`
  - 401/密码错误 → Toast"手机号或密码错误"；错误次数 ≥ 3 → `CaptchaBlock` 显示
  - 验证码错误 → 提示"验证码错误"并刷新验证码
  - 页面 `onMounted` 时若 `authStore.isLoggedIn` → 直接 `reLaunch` 主页（防止已登录用户访问登录页）

---

## 阶段 2：US2 — 语音录入销售单

> 目标：用户长按「销售」按钮录音，上传音频，流式逐条展示识别结果，核对后确认提交。

### 2a. 录音核心能力

- [x] T022 [US2] 创建 `src/composables/__tests__/useRecorder.test.ts`：测试以下行为——
  - `startRecording` 后 `isRecording` 变为 true
  - `stopRecording` 后 `isRecording` 变为 false 并 resolve Blob
  - 模拟 60s 超时：`onTimeout` 回调被调用，之后 `isRecording` 为 false
  - 重复调用 `startRecording` 不会开启第二个录音
- [x] T023 [US2] 实现 `src/composables/useRecorder.ts`：通过 T022 全部测试（H5 分支使用 `MediaRecorder`，小程序分支使用 `uni.getRecorderManager()`，60s 超时定时器）

### 2b. 流式请求平台适配

- [x] T024 [US2] 创建 `src/platform/h5/__tests__/streamRequest.test.ts`：mock `fetch`，测试——
  - FormData 包含正确的 `file` 和 `order_type` query 参数
  - 每次 chunk 到达时 `onEvent` 被正确调用（含 eventType 和 JSON data）
  - `AbortError` 不触发错误状态
  - HTTP 非 200 时 throw Error
- [x] T025 [US2] 实现 `src/platform/h5/streamRequest.ts`：通过 T024 全部测试（Fetch + ReadableStream + SSE 协议解析）
- [x] T026 [P] [US2] 实现 `src/platform/mp-weixin/streamRequest.ts`：使用 `wx.uploadFile` + `enableChunked` + `onChunkReceived`，逻辑与 H5 端对称（SSE 协议解析共用同一个纯函数解析器）

### 2c. 流程编排 Composable

- [x] T027 [US2] 创建 `src/composables/__tests__/useVoiceOrder.test.ts`：mock `streamUploadAudio`，测试——
  - 调用 `startVoiceOrder` 后 store `status` 变为 `Streaming`
  - `extracted` 事件 → `store.appendItem` 被调用，`clientId` 字段存在
  - `order_created` 事件 → `store.setOrderId` 被调用
  - `error` 事件 → `store.setError` 被调用
  - fetch 抛出非 AbortError → `store.setError` 被调用
  - `cancel()` 调用不触发 `setError`
- [x] T028 [US2] 实现 `src/composables/useVoiceOrder.ts`：通过 T027 全部测试

### 2d. UI 组件

- [x] T029 [US2] 创建 `src/components/business/__tests__/RecordButton.test.ts`：测试——
  - `touchstart` 触发 `emit('record-start')`
  - `touchend` 触发 `emit('record-stop', blob)`
  - `mousedown` / `mouseup` 同样触发（PC 兼容）
  - `disabled=true` 时 `touchstart` 不触发录音
  - 60s 超时触发 `emit('record-timeout')`
- [x] T030 [US2] 实现 `src/components/business/RecordButton.vue`：通过 T029 全部测试（内部调用 `useRecorder`，展示波形动画 slot，同时绑定 touch + mouse 事件）
- [x] T031 [P] [US2] 创建 `src/components/business/__tests__/OrderItemRow.test.ts`：测试——
  - 渲染 `item.name`、`item.quantity`、`item.unit`
  - 修改 name Input → emit `update:item`（含完整 patch 对象）
  - 点击删除按钮 → emit `delete` with `clientId`
- [x] T032 [US2] 实现 `src/components/business/OrderItemRow.vue`：通过 T031 全部测试（三个 BaseInput 双向绑定，删除按钮）
- [x] T033 [P] [US2] 创建 `src/components/business/__tests__/StreamingItemList.test.ts`：测试——
  - `streaming=true` 时渲染骨架屏 `LoadingRow`
  - `streaming=false` + `items` 非空时渲染对应数量的 `OrderItemRow`
  - 新增 item 时 DOM 中出现新条目
- [x] T034 [US2] 实现 `src/components/business/StreamingItemList.vue`：通过 T033 全部测试（骨架屏 + 条目 v-for，每条携带入场 CSS transition）
- [x] T035 [P] [US2] 创建 `src/components/business/__tests__/ActionBar.test.ts`：测试——
  - 点击「重新录音」→ emit `rerecord`
  - 点击「确认提交」→ emit `confirm`
  - `loading=true` 时「确认提交」按钮为 disabled 状态
- [x] T036 [US2] 实现 `src/components/business/ActionBar.vue`：通过 T035 全部测试（两个 BaseButton，loading 透传）

### 2e. 服务层与页面组装

- [x] T037 [US2] 实现 `src/services/order/index.ts`：封装 `confirmSalesOrder(id: number)` 和 `confirmPurchaseOrder(id: number)` 两个函数（通过 luch-request）
- [x] T038 [US2] 实现 `src/pages/home/index.vue`（完整版）：
  - `onMounted` 调用 `requireAuth()`
  - 渲染两个 `RecordButton`（label="销售" / label="进货"，`disabled` 绑定 `status !== Idle`）
  - 监听 `record-start` → store `status` → Recording
  - 监听 `record-timeout` → `uni.showToast('已达最大时长，自动发送')`
  - 监听 `record-stop(blob)` → `store.initSession(orderType)` → `store.setAudioBlob(blob)` → `voiceOrder.startVoiceOrder(blob)`
  - watch `store.status === Done` → `uni.navigateTo('/pages/order-detail/index')`
  - `status === Error` → 展示错误 Banner + 「重新发送」按钮，点击调用 `handleResend()`（从 store 取 audioBlob 重发）
- [x] T039 [US2] 实现 `src/pages/order-detail/index.vue`（完整版）：
  - `onMounted` 调用 `requireAuth()`，若 `store.orderId === null` → `uni.reLaunch('/pages/home/index')`（防止直接访问）
  - 渲染 `StreamingItemList`（streaming prop 绑定 `store.status === Streaming`）
  - 监听 `OrderItemRow` 的 `update:item` → `store.updateItem`；`delete` → `store.deleteItem`
  - `ActionBar` 监听 `rerecord` → `store.initSession` + `uni.reLaunch('/pages/home/index')`
  - `ActionBar` 监听 `confirm` → 调用对应 confirm service，成功 → `uni.reLaunch('/pages/home/index')`；失败 → Toast 错误信息留页面

---

## 阶段 3：US3 — 语音录入进货单

> 目标：进货流程与销售流程完全复用同一套组件和页面，仅 `orderType=PURCHASE` 不同。本阶段验证并收尾进货路径。

- [x] T040 [P] [US3] 创建 `src/composables/__tests__/useVoiceOrder.purchase.test.ts`：复用 T027 测试套件，将 `orderType` 替换为 `PURCHASE`，验证 `confirmPurchaseOrder` 被调用
- [x] T041 [US3] 在 `src/pages/home/index.vue` 补充「进货」按钮的 `record-stop` 处理：确认 `store.initSession('PURCHASE')` 正确传入，无逻辑重复（通过 orderType 参数统一处理）
- [x] T042 [US3] 在 `src/pages/order-detail/index.vue` 补充进货确认分支：`store.orderType === 'PURCHASE'` 时调用 `confirmPurchaseOrder(store.orderId)`，其余逻辑完全复用

---

## 阶段 4：精修与横切关注点

> 动画、全局错误兜底、样式一致性、ESLint 合规。

- [x] T043 [P] 创建 `src/components/business/WaveAnimation.vue`：录音波形动画组件（纯 CSS keyframe 动画，`visible` prop 控制展示/隐藏），由 `RecordButton` 内部引用
- [x] T044 [P] 创建 `src/components/business/LoadingRow.vue`：骨架屏单行组件（uview-plus `u-skeleton` 或自定义 shimmer），由 `StreamingItemList` 在 streaming 时展示
- [x] T045 [P] 完善 `src/styles/index.scss`：补充全局 transition class（`.fade-in-enter-active` / `.fade-in-leave-active`）用于条目入场动画，补充按钮按压态 `rpx` 阴影变量
- [x] T046 为 `src/utils/request.ts` 补充网络超时错误的全局 Toast 提示（在响应拦截器中识别 `statusCode === 0` 或 `timeout` 异常，展示"网络异常，请检查连接后重试"）
- [x] T047 全局代码质量扫描：运行 `eslint src --fix` + `stylelint src/**/*.scss --fix`，修正所有 lint 错误，确保无 `any`、无魔法数字残留
- [x] T048 [P] 补充 `vitest.config.ts`：配置覆盖率报告（`coverage: { reporter: ['text', 'lcov'] }`），确保 `composables/`、`stores/`、`utils/` 核心模块覆盖率 ≥ 80%

---

## 依赖关系速查

```
TP1 → TP2 → TP3 → TP4 → TP5 (必须串行，这5步完成后页面才能首次启动)
TP5 完成 → 阶段0 启动

T001─T003 可并行（三个配置文件互不依赖）
T004 (pages.json) → T005─T008 可并行（样式/常量/类型，视觉基础）
T009 (request.ts) → T010 (auth store test，拦截器引用 authStore)
T010 → T011 (auth store 实现)
T011 → T012 (voiceOrder store test)
T012 → T013 (voiceOrder store 实现)
T013 → T014 (routeGuard test，依赖 isLoggedIn)
T014 → T015 (routeGuard 实现)
T015 → T016 (auth service test)
T016 → T017 (auth service 实现)
T005─T008 完成 → T018─T019 可并行（BaseInput、BaseButton）
T019 → T020 (CaptchaBlock 依赖 BaseInput)
T020 → T021 (login 页依赖以上所有)
T022 → T023 (录音 test → 实现)
T024 → T025 (H5 stream test → 实现)
T026 可并行 T025 (小程序平台，不同文件)
T027 → T028 (useVoiceOrder test → 实现)
T029 → T030 (RecordButton test → 实现)
T031 → T032 (OrderItemRow test → 实现)
T033 → T034 (StreamingItemList test → 实现)
T035 → T036 (ActionBar test → 实现)
T037 (order service) → T038 (home page) → T039 (order-detail)
T040─T042 依赖 T037─T039 全部完成
T043─T048 均可并行执行（纯增量优化，不影响主流程）

⚠️  关键路径（让页面能冷启动）：TP1→TP2→TP3→TP4→TP5→T004→T021
```

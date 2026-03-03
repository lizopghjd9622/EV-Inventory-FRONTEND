# 生成技术方案

你现在是`ev_inventory`项目的首席前端架构师。
你的任务是基于我提供的`spec.md`，后端接口文件`00_openapi.json`，以及已有的`constitution.md`，为`智能销售库存系统`前端功能生成一份详细的技术实现方案（`plan.md`）。

## 需求规格说明

@./specs/init/001-sales-inventory/spec.md

## 技术规范 (必须遵循)

@./.claude/code_convention.md

## 方案内容要求 (必须包含)

1. **技术上下文总结：** 明确前端技术选型（框架、状态管理、路由、HTTP/流式请求库等）。
2. **"合宪性"审查：** 逐条对照 `constitution.md` 的原则，确认本技术方案符合所有条款。
3. **核心数据结构：** 页面间流转的核心 TypeScript 类型/接口定义（如 `SalesOrder`、`OrderItem` 等）。
4. **页面与组件设计：** 按页面拆分组件树，明确每个组件的职责、Props 和内部状态。
5. **状态管理方案：** 跨页面共享状态（如当前单据、音频 Blob、流式识别结果）的管理策略。
6. **关键流程实现：**
   - 长按录音的事件处理（`touchstart`/`touchend`/`mousedown`/`mouseup`）与 60 秒超时逻辑。
   - 音频文件一次性上传 + 流式响应（SSE/Chunked）的接收与逐条渲染。
   - 流式失败时保留音频 Blob 并支持重发的实现思路。
   - Token 持久化（`localStorage`）与路由守卫（未登录重定向）的实现。
7. **接口对接约定：** 前端调用的后端接口列表、请求/响应数据结构约定。

## 输出要求

1. 严格按照 @./.claude/templates/plan-template.md 的模板格式来组织你的输出（如果模板不存在，请自行设计一个结构清晰的 Markdown 格式）。
2. 完成后，将生成的 `plan.md` 内容写入到 `./specs/init/001-sales-inventory/plan.md` 文件中。
3. 图表和流程图使用 Mermaid 语法直接嵌入 Markdown 中，确保文档的可读性和专业性。

# 拆分任务列表

你是技术组长。仔细阅读 @./specs/init/001-sales-inventory/spec.md 和 @./specs/init/001-sales-inventory/plan.md, 将 `plan.md` 中描述的技术方案，分解成一个**详尽的、原子化的、有依赖关系的、可被AI直接执行的任务列表**。

## Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[Story] label**: REQUIRED for user story phase tasks only
   - Format: [US1], [US2], [US3], etc. (maps to user stories from spec.md)
   - Setup phase: NO story label
   - Foundational phase: NO story label  
   - User Story phases: MUST have story label
   - Polish phase: NO story label
5. **Description**: Clear action with exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID and Story label)
- ❌ WRONG: `T001 [US1] Create model` (missing checkbox)
- ❌ WRONG: `- [ ] [US1] Create User model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (missing file path)

## 关键要求

1. **任务粒度：** 每个任务应该只涉及一个主要文件的修改或创建一个新文件。不要出现“实现所有功能”这种大任务。
2. **TDD强制：** 根据`constitution.md`的“测试先行铁律”，**必须**先生成测试任务，后生成实现任务。
3. **并行标记：** 对于没有依赖关系的任务，请标记 `[P]`。
4. **阶段划分：** 即便`plan.md`中包含了粗略的阶段划分，也要以下面的为准。
    - **阶段1：** 基础（在用户故事开发前必须完成）, 包括数据库DDL脚本、领域模型（标明实体、聚合根、值对象）、ORM模型（包含索引信息）等
    - **阶段2+：** 按用户故事的优先级顺序划分阶段
        - 每个用户故事包含：测试 -> 领域对象方法 -> 领域服务或应用服务 -> API -> 集成
        - 每个阶段应该是完整、独立、可测试的交付增量
    - **最后阶段：** 大模细节和横切关注点的实现

---

将生成的任务列表写入到`./specs/init/001-sales-inventory/tasks.md`文件中。

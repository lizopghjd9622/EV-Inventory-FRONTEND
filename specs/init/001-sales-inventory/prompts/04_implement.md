# 按任务列表实现功能

- 任务列表： @.specs/init/001-sales-inventory/tasks.md
- 技术设计： @.specs/init/001-sales-inventory/plan.md
- 编程规约： @.claude/code_convention.md
- 测试规约： @.claude/test_convention.md

实现完成后，确保所有相关测试通过，并且代码符合编程规约。然后，将任务列表中已实现任务标记为完成。

## TDD（强制）

**严格遵循TDD流程： 红-绿-重构**, 你的todo列表必须明确包含TDD三阶段循环, 例如：

```
- [ ] TDD - Red: 编写测试，验证失败
- [ ] TDD - Green: 编写最少量的代码，使测试通过
- [ ] TDD - Refactor: 重构代码，保持测试通过
```

### 重构阶段

必须进行代码整理和优化，确保代码质量。重构过程中不得引入新的功能或改变现有功能的行为.
重构需要检查符合以下规约：

- 项目宪法（@.claude/constitution.md）
- 编程规约（**`特别注意`章节, 强制执行**）
- 测试规约

---

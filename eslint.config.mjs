import pluginVue from 'eslint-plugin-vue'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'

export default [
  // ── 忽略目录 ──
  {
    ignores: ['dist/**', 'node_modules/**', 'src/uni_modules/**'],
  },

  // ── Vue flat/recommended (包含 eslint:recommended 规则，自动设置 vue-eslint-parser) ──
  ...pluginVue.configs['flat/recommended'],

  // ── .ts 源文件：使用 tsParser ──
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TS essential rules（手动列举，避免引入已废弃的规则）
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-require-imports': 'error',
    },
  },

  // ── .vue 源文件：通过 parserOptions.parser 指定 ts 解析器 ──
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      /* TypeScript 规则 */
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      /* 魔法数字警告 */
      '@typescript-eslint/no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1, 2, 100, 200, 401, 404, 500],
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
        },
      ],
      /* Vue 组件规范 */
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/define-props-declaration': ['error', 'type-based'],
      /* 关闭与 Prettier 冲突的规则 */
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // ── 类型声明文件：忽略部分规则 ──
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-types': 'off',
    },
  },

  // ── 页面文件：uni-app 约定 index.vue 为页面入口，无需多词限制 ──
  {
    files: ['src/pages/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  // ── Prettier 关闭格式冲突规则（必须放最后）──
  prettier,
]

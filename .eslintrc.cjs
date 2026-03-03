module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'vue'],
  rules: {
    /* 禁止 any */
    '@typescript-eslint/no-explicit-any': 'error',
    /* 禁止魔法数字（business 代码中，常量文件除外） */
    'no-magic-numbers': 'off',
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
  },
  ignorePatterns: ['dist/', 'node_modules/', 'src/uni_modules/'],
}

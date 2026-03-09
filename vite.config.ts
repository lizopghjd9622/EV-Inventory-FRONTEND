import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // legacy JS API 使用 includePaths（uni-app 不支持新 API 的 loadPaths）
        includePaths: [resolve(__dirname, 'src')],
        // 静默第三方库（uview-plus）触发的 Dart Sass 弃用警告
        // legacy-js-api：uni-app 构建工具使用旧版 JS API；import：@import 语法
        silenceDeprecations: ['legacy-js-api', 'import'],
      },
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
})

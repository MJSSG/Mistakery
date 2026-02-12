import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // 代码分割策略
    rollupOptions: {
      output: {
        manualChunks(id) {
          // vendor chunks
          if (id.includes('node_modules')) {
            // Vue core
            if (id.includes('vue') || id.includes('@vue')) {
              return 'vue-core';
            }
            // Element Plus
            if (id.includes('element-plus')) {
              return 'element-plus';
            }
            // ECharts
            if (id.includes('echarts')) {
              return 'echarts';
            }
            // Other vendors
            return 'vendor';
          }

          // Feature-based chunks
          if (id.includes('src/views/mistake')) {
            return 'mistake';
          }
          if (id.includes('src/views/practice')) {
            return 'practice';
          }
          if (id.includes('src/views/review')) {
            return 'review';
          }
          if (id.includes('src/views/statistics')) {
            return 'statistics';
          }
          if (id.includes('src/views/user')) {
            return 'user';
          }
          if (id.includes('src/views/auth')) {
            return 'auth';
          }
        },
      },
      // Chunk size warning limit
      chunkSizeWarningLimit: 500,
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Source map for production
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
  },
  // CSS 预处理器配置
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;`,
      },
    },
  },
  // 开发服务器配置
  server: {
    port: 5173,
    host: true,
    // 预构建配置
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        'element-plus',
        'echarts',
      ],
    },
  },
});

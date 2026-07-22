import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      resolve: {
        // Monorepo 链接包必须共用同一套 Vue/Router runtime，否则 ref 与注入上下文会失效。
        dedupe: ['vue', 'vue-router'],
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, '/api'),
            // 后端API服务器地址
            target: 'http://127.0.0.1:8000',
            ws: true,
          },
        },
      },
    },
  };
});

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const repoRoot = path.resolve(__dirname, '..');
    const rootEnv = loadEnv(mode, repoRoot, '');
    const appEnv = loadEnv(mode, __dirname, '');
    const env = { ...rootEnv, ...appEnv };

    const proxyTarget = (
      env.VITE_PROXY_TARGET ||
      env.VITE_DEV_PROXY_TARGET ||
      env.BACKEND_URL ||
      env.API_URL ||
      'http://127.0.0.1:8000'
    ).trim();

    /** Example app `chat_server.py` (autonomous LLM buyer); not the marketplace on 4021. */
    const autonomousBuyerTarget = (
      env.VITE_AUTONOMOUS_BUYER_PROXY_TARGET ||
      env.AUTONOMOUS_BUYER_CHAT_BASE ||
      'http://127.0.0.1:9095'
    ).trim();

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
          },
          '/health': {
            target: proxyTarget,
            changeOrigin: true,
          },
          '/autonomous-buyer-proxy': {
            target: autonomousBuyerTarget,
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/autonomous-buyer-proxy/, '') || '/',
          },
        }
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

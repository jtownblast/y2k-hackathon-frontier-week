import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // SD sidecar — see server/README.md. Long timeout because generation
      // is ~50 s per image on MPS fp32.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 180_000,
      },
    },
  },
});

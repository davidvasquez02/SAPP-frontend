import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://sapp.eisi.online',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build',
  }
});

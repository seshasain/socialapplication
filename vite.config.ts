import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Add to vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'form-vendor': ['react-dropzone', 'react-datepicker']
        }
      }
    },
    minify: 'terser',
    sourcemap: false
  }
});

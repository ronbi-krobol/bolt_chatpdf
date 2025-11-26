import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/bolt_chatpdf/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['idb', 'jspdf', 'xlsx', 'file-saver', 'framer-motion'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pdf-vendor': ['pdfjs-dist'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
});

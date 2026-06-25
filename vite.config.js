import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    extensions: ['.jsx', '.js', '.ts', '.tsx', '.json'],
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  optimizeDeps: {
    include: ['html2pdf.js'],
  },
  build: {
    commonjsOptions: {
      include: [/html2pdf\.js/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('/src/routes/AdminRoutes')) {
              return 'admin-routes';
            }
            if (id.includes('/src/components/sales/')) {
              return 'sales';
            }
            return undefined;
          }
          if (id.includes('apexcharts') || id.includes('react-apexcharts')) {
            return 'charts';
          }
          if (id.includes('@tiptap')) {
            return 'editor';
          }
          if (id.includes('firebase')) {
            return 'firebase';
          }
          if (id.includes('@stripe')) {
            return 'stripe';
          }
          if (id.includes('html2pdf')) {
            return 'pdf';
          }
          if (id.includes('framer-motion')) {
            return 'motion';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})

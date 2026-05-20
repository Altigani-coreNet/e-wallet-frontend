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
  },
})

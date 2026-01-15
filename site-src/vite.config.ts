import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../', // Build to repository root
    emptyOutDir: false, // CRITICAL: Do not delete existing files in root (images, etc)
    rollupOptions: {
        output: {
            entryFileNames: 'dist/[name].js',
            chunkFileNames: 'dist/[name].js',
            assetFileNames: 'dist/[name].[ext]'
        }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "/branding": path.resolve(__dirname, "../branding"),
    },
  },
})

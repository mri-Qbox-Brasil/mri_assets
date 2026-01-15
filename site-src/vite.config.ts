import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-root-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.originalUrl || req.url;
          if (!url) return next();

          if (url === '/manifest.json' || url.startsWith('/assets/') || url.startsWith('/branding/') || url.startsWith('/clothing/') || url.startsWith('/dui/') || url.startsWith('/props/')) {
             const filePath = path.resolve(__dirname, '..', url.slice(1)); // Remove leading slash
             try {
                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                   // Let strict mode handling happen if needed, but for dev this is fine
                   // Determining mime type simply
                   const ext = path.extname(filePath).toLowerCase();
                   const mimeTypes: Record<string, string> = {
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.gif': 'image/gif',
                        '.svg': 'image/svg+xml',
                        '.json': 'application/json',
                        '.webp': 'image/webp',
                        '.mp4': 'video/mp4',
                        '.webm': 'video/webm'
                    };
                   res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
                   fs.createReadStream(filePath).pipe(res);
                   return;
                }
             } catch (e) {
                 console.error("Error serving asset:", e);
             }
          }
          next();
        });
      }
    }
  ],
  server: {
      fs: {
          allow: ['..']
      }
  },
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
    },
  },
})

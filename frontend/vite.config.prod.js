import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://your-render-app.onrender.com' 
          : 'http://localhost:3001',
        changeOrigin: true,
        secure: true,
        timeout: 120000,
      },
      '/socket.io': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://your-render-app.onrender.com' 
          : 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        secure: process.env.NODE_ENV === 'production',
        timeout: 0,
        proxyTimeout: 0,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.warn('Socket.IO proxy error:', err.code, err.message);
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
            }
          });
        },
      },
    },
  },
})
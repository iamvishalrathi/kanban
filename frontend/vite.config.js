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
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 120000,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        secure: false,
        timeout: 0, // Disable timeout for WebSocket connections
        proxyTimeout: 0,
        configure: (proxy, options) => {
          // Enhanced error handling
          proxy.on('error', (err, req, res) => {
            console.warn('Socket.IO proxy error:', err.code, err.message);
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
            }
          });
          
          // WebSocket error handling
          proxy.on('upgrade', (req, socket, head) => {
            socket.on('error', (err) => {
              console.warn('WebSocket upgrade error:', err.code);
            });
          });
          
          // Connection logging
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            console.log('🔌 WebSocket proxy connecting:', req.url);
            
            // Handle socket errors gracefully
            socket.on('error', (err) => {
              if (err.code !== 'ECONNRESET') {
                console.warn('WebSocket socket error:', err.code);
              }
            });
            
            proxyReq.on('error', (err) => {
              if (err.code !== 'ECONNRESET') {
                console.warn('WebSocket proxyReq error:', err.code);
              }
            });
          });
        }
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', '@dnd-kit/core', '@dnd-kit/sortable'],
        },
      },
    },
  },
})

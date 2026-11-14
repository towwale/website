import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  // The 3D stage is lazy-loaded. Pre-bundle its libraries up front, otherwise the dev
  // server discovers them late and can end up serving two copies of React.
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'three', '@react-three/fiber', '@react-three/drei', 'lenis'],
  },
  // three.js is large by nature. It loads as its own lazy chunk, after the page is readable.
  build: { target: 'es2020', chunkSizeWarningLimit: 1000 },
})

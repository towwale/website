import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  // The 3D scene is lazy-loaded, so pre-bundle its libraries up front.
  // Otherwise Vite discovers them late and can load two copies of React in dev.
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing', 'gsap', 'gsap/ScrollTrigger', 'lenis'],
  },
})

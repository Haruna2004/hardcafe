import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        main: r('./index.html'),
        sim: r('./sim/index.html'),
        build: r('./build/index.html'),
        landscape: r('./landscape/index.html'),
      },
    },
  },
})

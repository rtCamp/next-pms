import react from "@vitejs/plugin-react";
import { defineConfig } from 'vite'
import path from "path"
import { resolve } from 'path'
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@next-pms/design-system',
    }
  },
  resolve: {
    alias: {
      "@design-system": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    devSourcemap: true,
  }
})

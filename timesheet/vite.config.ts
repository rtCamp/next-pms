import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import proxyOptions from "./proxyOptions";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: proxyOptions,
  },
  build: {
    outDir: "../timesheet_enhancer/public/timesheet",
    emptyOutDir: true,
    target: "es2015",
  },
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

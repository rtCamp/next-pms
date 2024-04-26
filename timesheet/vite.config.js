import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../timesheet_enhancer/public/timesheet",
    emptyOutDir: true,
    target: "es2015",
  },
});

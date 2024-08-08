import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let proxyConfig = {}
  if (env.VITE_SITE_NAME && env.VITE_SITE_PORT) {
    proxyConfig = {
      "^/(app|api|assets|files|private)": {
        target: `http://localhost:${env.VITE_SITE_PORT}`,
        ws: true,
        changeOrigin: true,
        secure: false,
        router: function (req) {
          return `http://${env.VITE_SITE_NAME}:${env.VITE_SITE_PORT}`;
        },
      }
    }
  }
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: proxyConfig,
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
  }
})

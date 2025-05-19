/**
 * External dependencies.
 */
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../../", "");
  let proxyConfig = {};

  if (env.VITE_SITE_NAME && env.VITE_SITE_PORT) {
    proxyConfig = {
      "^/(app|api|assets|files|private)": {
        target: `http://${env.VITE_SITE_NAME}:${env.VITE_SITE_PORT}`,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    };
  }

  return {
    envDir: resolve(__dirname),
    root: resolve(__dirname, "./packages/app"),
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: proxyConfig,
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./packages/app/src"),
      },
    },
    build: {
      outDir: "../../../next_pms/public/frontend",
      emptyOutDir: true,
      target: "es2015",
    },
  };
});

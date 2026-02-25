/**
 * External dependencies.
 */
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../../", "");
  let proxyConfig = {};

  if (env.VITE_SITE_NAME && env.VITE_SITE_PORT) {
    proxyConfig = {
      "^/(app|api|assets|files|private|socket.io)": {
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
    plugins: [
      react(),
      tailwindcss(),
      svgr({
        include: "**/*.svg?react",
      }),
    ],
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

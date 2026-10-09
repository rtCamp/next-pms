import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import frappeui from "frappe-ui/vite";

export default defineConfig({
  plugins: [
    frappeui({
      frontendRoute: "/next-pms",
      frappeProxy: { port: 5173 },
      buildConfig: {
        outDir: "../next_pms/public/frontend",
        baseUrl: "/assets/next_pms/frontend/",
        indexHtmlPath: "../next_pms/www/next-pms/index.html",
      },
    }),
    vue(),
  ],
});

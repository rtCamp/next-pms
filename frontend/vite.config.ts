import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import frappeui from "frappe-ui/vite";
import type { Plugin as EsbuildPlugin } from "esbuild";

// frappe-ui maps its `#molecules/*`-style imports to a list of fallbacks
// (`./src/molecules/*`, then `*.ts`, then `*/index.ts`). Vite's resolver copes,
// but esbuild's dependency pre-bundling only tries the first, so pre-bundling
// `frappe-ui/editor` fails with "Could not resolve #molecules/editor/...".
// This tries the `.ts` and `/index.ts` fallbacks for esbuild.
const frappeUiSubpathImports: EsbuildPlugin = {
  name: "frappe-ui-subpath-imports",
  setup(build) {
    build.onResolve(
      { filter: /^#(components|molecules|composables|utils)\/[^.]*$/ },
      async ({ path, importer, kind }) => {
        const root = importer.slice(
          0,
          importer.lastIndexOf("/frappe-ui/") + 11,
        );
        if (root.length <= 11) return undefined;
        const base = `./src/${path.slice(1)}`;
        for (const candidate of [`${base}.ts`, `${base}/index.ts`]) {
          const result = await build.resolve(candidate, {
            resolveDir: root,
            kind,
          });
          if (!result.errors.length) return { path: result.path };
        }
        return undefined;
      },
    );
  },
};

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
    // Applies to the dev server only; Storybook and story tests drop it.
    vueDevTools(),
  ],
  // `@/` is `src/`, so imports don't climb with `../../`. Storybook and the story
  // tests build on this config, so they resolve it too.
  resolve: {
    // `.pathname` rather than node's fileURLToPath: the project has no Node types.
    alias: {
      "@": decodeURIComponent(new URL("./src", import.meta.url).pathname),
    },
  },
  optimizeDeps: {
    // frappe-ui's editor `.vue` node views can't be pre-bundled with the rest of
    // `frappe-ui/editor`, so they import tiptap on their own. Pre-bundling these
    // keeps a single copy; two copies of ProseMirror fail every editor with
    // "Adding different instances of a keyed plugin".
    include: [
      "@tiptap/vue-3",
      "@tiptap/core",
      "@tiptap/pm/state",
      "@tiptap/pm/view",
      "@tiptap/pm/model",
    ],
    esbuildOptions: { plugins: [frappeUiSubpathImports] },
  },
});

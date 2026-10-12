// Builds on vite.config.ts so story tests resolve frappe-ui (its Vite plugin and
// the esbuild resolver for `frappe-ui/editor`) the same way the app does.
import { defineConfig, mergeConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import type { PluginOption } from "vite";
import viteConfig from "./vite.config";

// Vue DevTools would inject its overlay into every story under test.
const isDevTools = (plugin: PluginOption) =>
  !!plugin &&
  typeof plugin === "object" &&
  "name" in plugin &&
  /^vite-plugin-(vue-devtools|inspect|vue-inspector)/.test(plugin.name);

export default mergeConfig(
  {
    ...viteConfig,
    plugins: (viteConfig.plugins ?? [])
      .flat(Infinity as 1)
      .filter((plugin) => !isDevTools(plugin)),
  },
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          plugins: [storybookTest({ configDir: ".storybook" })],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  }),
);

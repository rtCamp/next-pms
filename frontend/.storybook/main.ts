import type { StorybookConfig } from "@storybook/vue3-vite";
import type { PluginOption } from "vite";

// Vite plugins that only make sense for the app served by Frappe: frappe-ui's
// dev proxy and port, the Jinja boot data in index.html, and the build output
// into next_pms/public (which a Storybook build would wipe); and Vue DevTools,
// whose overlay would sit inside every story.
const APP_ONLY_PLUGINS = new Set([
  "frappeui-proxy-plugin",
  "frappeui-jinja-boot-data-plugin",
  "frappeui-build-config-plugin",
  "frappeui-site-banner-plugin",
  "vite-plugin-vue-devtools",
  "vite-plugin-inspect",
  "vite-plugin-vue-inspector",
  "vite-plugin-vue-inspector:post",
]);

function isAppOnly(plugin: PluginOption): boolean {
  return (
    !!plugin &&
    typeof plugin === "object" &&
    "name" in plugin &&
    APP_ONLY_PLUGINS.has(plugin.name)
  );
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.ts"],
  addons: [
    "@storybook/addon-mcp",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
  ],
  framework: "@storybook/vue3-vite",
  features: { componentsManifest: true, experimentalDocgenServer: true },
  viteFinal(config) {
    config.plugins = (config.plugins ?? [])
      .flat(Infinity as 1)
      .filter((plugin) => !isAppOnly(plugin));
    return config;
  },
};

export default config;

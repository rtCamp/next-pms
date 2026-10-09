import type { StorybookConfig } from "@storybook/vue3-vite";
import type { PluginOption } from "vite";

// frappe-ui's Vite plugins that only make sense for the app served by Frappe:
// the dev proxy and port, the Jinja boot data in index.html, and the build
// output into next_pms/public (which a Storybook build would wipe).
const APP_ONLY_PLUGINS = new Set([
  "frappeui-proxy-plugin",
  "frappeui-jinja-boot-data-plugin",
  "frappeui-build-config-plugin",
  "frappeui-site-banner-plugin",
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

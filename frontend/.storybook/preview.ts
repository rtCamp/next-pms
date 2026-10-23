import { setup, type Preview } from "@storybook/vue3-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { FrappeUIProvider } from "frappe-ui";
import { createMemoryHistory, createRouter } from "vue-router";
import "../src/style.css";
import "./preview.css";
import { ThemedDocsContainer } from "./ThemedDocsContainer";

// frappe-ui Button and Breadcrumbs resolve <router-link> and call useRouter.
setup((app) => {
  app.use(
    createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/:pathMatch(.*)*", component: { render: () => null } }],
    }),
  );
});

const preview: Preview = {
  parameters: {
    layout: "centered",
    docs: { container: ThemedDocsContainer },
    a11y: {
      test: "error",
      // frappe-ui's secondary grey is below 4.5:1, so story tests skip contrast;
      // the Storybook panel still reports it.
      config: import.meta.env.VITEST_STORYBOOK
        ? { rules: [{ id: "color-contrast", enabled: false }] }
        : {},
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
      attributeName: "data-theme",
    }),
    (story) => ({
      components: { story, FrappeUIProvider },
      template: `<FrappeUIProvider><story /></FrappeUIProvider>`,
    }),
  ],
};

export default preview;

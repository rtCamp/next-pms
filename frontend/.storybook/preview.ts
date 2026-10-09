import type { Preview } from "@storybook/vue3-vite";
import { FrappeUIProvider } from "frappe-ui";
import "../src/style.css";

const preview: Preview = {
  parameters: { layout: "fullscreen" },
  globalTypes: {
    theme: {
      description: "Colour scheme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (story, context) => {
      document.documentElement.dataset.theme = context.globals.theme;
      return {
        components: { story, FrappeUIProvider },
        template: `
          <FrappeUIProvider>
            <div class="min-h-screen bg-surface-base p-4 text-ink-gray-8">
              <story />
            </div>
          </FrappeUIProvider>
        `,
      };
    },
  ],
};

export default preview;

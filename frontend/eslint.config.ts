import { globalIgnores } from "eslint/config";
import pluginVue from "eslint-plugin-vue";
import storybook from "eslint-plugin-storybook";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import globals from "globals";

export default defineConfigWithVueTs(
  globalIgnores(["storybook-static/**", "node_modules/**"]),
  {
    name: "app/files",
    files: ["**/*.{ts,mts,vue}"],
    languageOptions: { globals: globals.browser },
  },
  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  storybook.configs["flat/recommended"],
  {
    name: "app/rules",
    rules: {
      // Our components follow frappe-ui's single-word names (Card, Filter, Comments).
      "vue/multi-word-component-names": "off",
      // Optional props declared with TypeScript types are `undefined` when absent; a default adds nothing.
      "vue/require-default-prop": "off",
      // Slot props reach the consumer verbatim, so hyphenating them would rename the slot's API.
      "vue/attribute-hyphenation": ["warn", "always", { ignoreTags: ["slot"] }],
    },
  },
  // Prettier owns formatting (P10); this turns off the rules that would fight it.
  skipFormatting,
);

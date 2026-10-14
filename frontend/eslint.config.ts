import { globalIgnores } from "eslint/config";
import pluginVue from "eslint-plugin-vue";
import pluginVueA11y from "eslint-plugin-vuejs-accessibility";
import vueComposable from "@scayle/eslint-plugin-vue-composable";
import betterTailwind from "eslint-plugin-better-tailwindcss";
import { getDefaultSelectors } from "eslint-plugin-better-tailwindcss/defaults";
import storybook from "eslint-plugin-storybook";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import globals from "globals";

// `no-restricted-syntax` takes one list per file, so story files repeat these.
const reactivitySyntax = [
  {
    selector:
      "VariableDeclarator[id.type='ObjectPattern'] > CallExpression.init[callee.name=/^use(Call|List|Doc)$/]",
    message:
      "Destructuring loses reactivity. Keep the object (`const tasks = useCall(...)`) and read `tasks.data`.",
  },
  {
    selector:
      "CallExpression[callee.name='watch'][arguments.0.type='MemberExpression']",
    message:
      "This watches the current value, not the property. Watch a getter: `watch(() => tasks.data, ...)`.",
  },
];

const storySyntax = [
  {
    selector:
      "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: "Use a fixed date, so the story renders the same every day.",
  },
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: "Use a fixed date, so the story renders the same every day.",
  },
  {
    selector:
      "CallExpression[callee.name='ref'][arguments.0.object.name='args']",
    message:
      "A copy of an arg ignores the Controls panel. Use `useArgs()` from `storybook/preview-api`.",
  },
  {
    selector: "CallExpression[callee.property.name='toHaveClass']",
    message: "Assert ARIA state or visible text, not styling.",
  },
  {
    selector: "CallExpression[callee.name='setTimeout']",
    message: "Wait for the result with `waitFor`, not a fixed delay.",
  },
];

export default defineConfigWithVueTs(
  globalIgnores(["storybook-static/**", "node_modules/**"]),
  {
    name: "app/files",
    files: ["**/*.{ts,mts,vue}"],
    languageOptions: { globals: globals.browser },
  },
  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  ...pluginVueA11y.configs["flat/recommended"],
  storybook.configs["flat/recommended"],
  {
    name: "app/rules",
    plugins: { "@scayle/vue-composable": vueComposable },
    rules: {
      // Our components follow frappe-ui's single-word names (Card, Filter, Comments).
      "vue/multi-word-component-names": "off",
      // Optional props declared with TypeScript types are `undefined` when absent; a default adds nothing.
      "vue/require-default-prop": "off",
      // Slot props reach the consumer verbatim, so hyphenating them would rename the slot's API.
      "vue/attribute-hyphenation": ["warn", "always", { ignoreTags: ["slot"] }],
      "@scayle/vue-composable/no-composable-after-await": "error",
      "@scayle/vue-composable/no-computed-after-await": "error",
      "@scayle/vue-composable/no-lifecycle-after-await": "error",
      "@scayle/vue-composable/no-watch-after-await": "error",
      "@scayle/vue-composable/require-explicit-fallthrough-attrs": "error",
      "no-restricted-syntax": ["error", ...reactivitySyntax],
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "pinia",
              message:
                "Shared state lives in plain reactive modules, not stores.",
            },
            {
              name: "vuedraggable",
              message: "Unmaintained since 2021. Use @dnd-kit/vue.",
            },
            {
              name: "frappe-ui",
              importNames: [
                "createResource",
                "createListResource",
                "createDocumentResource",
              ],
              message: "Use useCall, useList or useDoc.",
            },
            {
              name: "tailwind-merge",
              message: "Merge classes with the `cn` helper.",
            },
            { name: "clsx", message: "Merge classes with the `cn` helper." },
          ],
        },
      ],
      "no-restricted-globals": [
        "warn",
        {
          name: "fetch",
          message: "Fetch data with frappe-ui's useCall or call().",
        },
      ],
      "no-restricted-properties": [
        "warn",
        {
          object: "document",
          property: "cookie",
          message: "Read cookies through src/session.",
        },
      ],
      "vue/no-restricted-block": [
        "warn",
        { element: "style", message: "Style with Tailwind classes." },
      ],
      "vue/no-restricted-static-attribute": [
        "warn",
        {
          key: "aria-disabled",
          message:
            "Use the real `disabled` attribute unless the control must stay usable.",
        },
      ],
      "vue/no-restricted-v-bind": [
        "warn",
        {
          argument: "aria-disabled",
          message:
            "Use the real `disabled` attribute unless the control must stay usable.",
        },
      ],
    },
  },
  {
    name: "app/tailwind",
    files: ["src/**/*.{ts,vue}"],
    plugins: { "better-tailwindcss": betterTailwind },
    settings: {
      "better-tailwindcss": {
        tailwindConfig: "tailwind.config.js",
        // Also check class maps such as `WEEK_TOTAL_CLASS` and `iconClasses`.
        selectors: [
          ...getDefaultSelectors(),
          {
            kind: "variable",
            name: "^.*(_CLASS(ES)?|Class(es)?)$",
            match: [{ type: "strings" }, { type: "objectValues" }],
          },
        ],
      },
    },
    rules: {
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-restricted-classes": [
        "warn",
        {
          restrict: [
            {
              pattern: "^(.*:)?!|!$",
              message:
                "Avoid `!`. Use a prop, a slot or a data-slot/data-state selector first.",
            },
            {
              pattern: "^(.*:)?\\[&",
              message:
                "This reaches into another component's markup. Use a prop, a slot or a data-slot/data-state selector first.",
            },
            {
              pattern: "^(?!(.*:)?\\[&).*\\[",
              message: "Use a scale step (e.g. `min-w-100`) when one exists.",
            },
          ],
        },
      ],
    },
  },
  {
    name: "app/session-exceptions",
    files: ["src/boot.ts", "src/session/**"],
    rules: {
      "no-restricted-globals": "off",
      "no-restricted-properties": "off",
    },
  },
  {
    name: "app/stories",
    files: ["src/**/*.stories.ts"],
    rules: {
      "no-restricted-syntax": ["error", ...reactivitySyntax, ...storySyntax],
    },
  },
  {
    name: "app/visual-stories",
    files: ["src/**/*.stories.ts"],
    ignores: ["src/**/*.interactions.stories.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...reactivitySyntax,
        ...storySyntax,
        {
          selector: "Property[key.name='play']",
          message:
            "Put stories with a play function in Name.interactions.stories.ts.",
        },
        {
          selector: "Property[key.name='template'] Literal[value=/v-for/]",
          message: "Render one component instance per visual story.",
        },
        {
          selector:
            "Property[key.name='template'] TemplateElement[value.raw=/v-for/]",
          message: "Render one component instance per visual story.",
        },
      ],
    },
  },
  {
    name: "app/interaction-stories",
    files: ["src/**/*.interactions.stories.ts"],
    rules: {
      // One behaviour per play function.
      "max-lines-per-function": [
        "error",
        { max: 40, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  // Prettier owns formatting (P10); this turns off the rules that would fight it.
  skipFormatting,
);

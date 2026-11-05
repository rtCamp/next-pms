/**
 * External dependencies.
 */
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import perfectionist from "eslint-plugin-perfectionist";
import parser from "@typescript-eslint/parser";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: parser,
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      perfectionist,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "perfectionist/sort-imports": [
        "error",
        {
          newlinesBetween: "ignore",
          newlinesInside: "ignore",
          customGroups: [
            {
              groupName: "react",
              elementNamePattern: ["^react$", "^react-[^/]*$"],
            },
          ],
          groups: [
            "builtin",
            "react",
            "external",
            "internal",
            ["sibling", "index"],
            "parent",
            "unknown",
          ],
        },
      ],
    },
  },
);

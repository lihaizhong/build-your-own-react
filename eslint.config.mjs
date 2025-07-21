import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import markdown from "@eslint/markdown";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  tseslint.config(js.configs.recommended, tseslint.configs.recommended, {
    rules: {
      "prettier/prettier": "error",
      "no-case-declarations": "off",
      "no-constant-condition": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }),
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/commonmark",
    extends: ["markdown/recommended"],
  },
  eslintPluginPrettierRecommended,
]);

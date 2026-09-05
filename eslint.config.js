import js from "@eslint/js";
import globals from "globals";
import eslintPluginJsonc from "eslint-plugin-jsonc";
import eslintPluginYml from "eslint-plugin-yml";
import eslintPluginHtml from "eslint-plugin-html";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "dist/**",
      "build/**",
      "**/*.css",
      "**/*.scss",
      "warp.json",
      ".github/**",
      "sub/**/*.md",
      "edge/waste/**",
      "edge/unite.js",
      "**/clash-12.**",
      "node_modules/**",
      "DNS over HTTPS/**",
      "package-lock.json",
      "sub/clash-meta.yml",
      "edge/all-in-one.js",
      "edge/LoadBalance.js",
      "sub/proton-wire.json",
      "sub/H2-for-SingBox.json",
      "edge/assets/clash-11.yaml",
      "real address generator/**",
      "boringtun-boringtun-cli-0.5.2/**",
      "edge/assets/clash-meta-wg-template.yml",
    ],
  },

  // ---JavaScript---
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        fetch: "readonly",
        Response: "readonly",
        URLSearchParams: "readonly",
        btoa: "readonly",
        atob: "readonly",
        Headers: "readonly",
        Blob: "readonly",
        TextDecoder: "readonly",
        TransformStream: "readonly",
        WritableStream: "readonly",
        ReadableStream: "readonly",
        WebSocketPair: "readonly",
        addEventListener: "readonly",
        console: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-irregular-whitespace": [
        "error",
        { skipStrings: true, skipComments: false, skipRegExps: true, skipTemplates: true },
      ],
      "no-undef": "error",
      "no-unused-vars": "warn",
    },
  },

  // ---TypeScript---
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        fetch: "readonly",
        Response: "readonly",
        URLSearchParams: "readonly",
        btoa: "readonly",
        atob: "readonly",
        Headers: "readonly",
        Blob: "readonly",
        TextDecoder: "readonly",
        TransformStream: "readonly",
        WritableStream: "readonly",
        ReadableStream: "readonly",
        WebSocketPair: "readonly",
        addEventListener: "readonly",
        console: "readonly",
        URL: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      eqeqeq: ["error", "always"],
    },
  },

  // ---JSON — JSONC — JSON5---
  ...eslintPluginJsonc.configs["recommended-with-jsonc"],
  {
    files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
    rules: {
      "jsonc/sort-keys": "error",
    },
  },
  ...eslintPluginJsonc.configs.prettier,

  // ---YAML---
  ...eslintPluginYml.configs.standard,
  { files: ["**/*.yaml", "**/*.yml"] },
  ...eslintPluginYml.configs.prettier,

  // ---HTML — For linting <script> blocks---
  {
    files: ["**/*.html"],
    plugins: { html: eslintPluginHtml },
    languageOptions: { globals: { ...globals.browser } },
  },

  eslintConfigPrettier,
];

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Additional rules for code quality - strict mode
  {
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error", // Changed from warn to error
      "react-hooks/set-state-in-effect": "error", // Prevent setState in effects
      "react-hooks/purity": "error", // Prevent impure functions in render
      "no-console": ["error", { allow: ["warn", "error"] }], // Changed from warn to error
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }], // Changed from warn to error
      "react/no-unescaped-entities": "error", // Changed from warn to error
      "@next/next/no-img-element": "warn", // Keep as warn (can be intentional)
      "@next/next/no-page-custom-font": "warn", // Keep as warn
      "prefer-const": "error", // Changed from warn to error
      "react/display-name": "error", // Changed from warn to error
    },
  },
]);

export default eslintConfig;

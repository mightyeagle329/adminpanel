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
  {
    rules: {
      // This project currently uses "any" heavily at API boundaries and for
      // rapid prototyping. To keep linting useful and non-blocking, we relax
      // this rule globally for now. We can tighten it gradually in focused
      // areas later.
      "@typescript-eslint/no-explicit-any": "off",

      // Allow intentionally unused variables when prefixed with `_`, and
      // ignore rest siblings. This keeps the rule helpful without fighting
      // against common patterns (e.g. unused error objects in catch blocks).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // The default React Hooks rules are very strict. For this admin panel,
      // we prefer flexibility while we iterate quickly. We can re-enable
      // these selectively later if needed.
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",

      // Allow apostrophes and quotes in JSX text without forcing HTML entities.
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;

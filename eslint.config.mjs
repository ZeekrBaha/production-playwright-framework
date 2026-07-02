import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import playwright from "eslint-plugin-playwright";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/.auth/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
  },
  {
    files: ["apps/workbench/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    files: ["e2e/**/*.ts"],
    plugins: { playwright },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
    },
  },
  {
    files: ["e2e/tests/workbench/**/*.ts", "e2e/tests/**/*.spec.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "NewExpression[callee.name=/^(LoginPage|DashboardPage|OrgSelectionPage|ForecastListPage|ForecastGridPage|CreateForecastModal|AddDriverModal|CopyForecastModal|CompareModal)$/]",
          message: "Instantiate page objects via PageFactory, not directly.",
        },
      ],
    },
  },
  {
    // PageFactory is the sanctioned instantiation point for page objects.
    files: ["e2e/tests/workbench/page-factory.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  prettier,
);

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: [
      "apps/**/tests/unit/**/*.test.ts",
      "apps/**/tests/integration/**/*.test.ts",
    ],
    exclude: ["apps/**/tests/e2e.spec.ts"],
    environmentOptions: {
      jsdom: {
        runScripts: "dangerously",
        resources: "usable",
      },
    },
  },
});

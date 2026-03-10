import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: [
      "apps/**/tests/unit.test.js",
      "apps/**/tests/integration.test.js",
    ],
    exclude: ["apps/**/tests/e2e.spec.js"],
    environmentOptions: {
      jsdom: {
        runScripts: "dangerously",
        resources: "usable",
      },
    },
  },
});

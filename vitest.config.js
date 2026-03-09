import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["apps/**/*.unit.test.js"],
    exclude: ["apps/**/*.e2e.spec.js"],
    environmentOptions: {
      jsdom: {
        runScripts: "dangerously",
        resources: "usable",
      },
    },
  },
});

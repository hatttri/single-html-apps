import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    environmentOptions: {
      jsdom: {
        runScripts: 'dangerously',
        resources: 'usable'
      }
    }
  },
});

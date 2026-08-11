import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    include: [
      "packages/*/src/**/*.test.ts",
      "services/*/src/**/*.test.ts",
      "scripts/**/*.test.mjs",
      "frontend/src/lib/**/*.test.ts",
      "docs/keeperhub-contribution/**/*.test.ts"
    ],
    coverage: {
      enabled: false
    }
  }
});

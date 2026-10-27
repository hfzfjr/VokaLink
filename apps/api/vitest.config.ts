import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 20000,
    env: {
      SUPABASE_JWT_SECRET:
        "test-secret-key-for-vitest-and-ci-testing-minimum-32-chars-long",
    },
  },
});

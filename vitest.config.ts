import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./frontend/src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    // Repository-integrity tests spawn verification subprocesses (git ls-files,
    // registry validator, secret scan) that can exceed the 5s Vitest default
    // on cold machines/CI. A 30s per-test budget keeps them deterministic.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});

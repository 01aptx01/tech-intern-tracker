import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.{ts,tsx}"], testTimeout: 20_000 },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, ".") } },
});

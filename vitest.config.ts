import { defineConfig } from "vitest/config";
import path from "node:path";

// Minimal Node runner for pure TS modules — no DOM, no React plugin needed.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
});

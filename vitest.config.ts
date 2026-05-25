import path from "path";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@wizardconnect/core": path.resolve(__dirname, "../core/src/index.ts"),
      "@wizardconnect/dapp": path.resolve(__dirname, "../dapp/src/index.ts"),
    },
  },
  test: {
    environment: "happy-dom",
    exclude: ["**/*.integration.test.ts", "**/node_modules/**"],
  },
});

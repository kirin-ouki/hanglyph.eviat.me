import { defineConfig } from "vitest/config";

// 單元測試只覆蓋純函式（不需瀏覽器/DB）。
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});

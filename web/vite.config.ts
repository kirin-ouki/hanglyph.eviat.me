import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 路線 A：純靜態。base 可在部署 GitHub Pages 時以 VITE_BASE 覆寫（如 "/CHCT/"）。
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  // sql.js-httpvfs 內含預編譯 worker 與 wasm，交給 Vite 以 new URL(...) 解析，勿預打包。
  optimizeDeps: { exclude: ["sql.js-httpvfs"] },
  worker: { format: "es" },
  server: { port: 5173 },
});

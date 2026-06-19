import { defineConfig, type Connect } from "vite";
import react from "@vitejs/plugin-react";
import { statSync, createReadStream } from "node:fs";
import { resolve } from "node:path";
import type { ServerResponse } from "node:http";

// 讓 dev / preview 伺服器對 char.sqlite 正確回應 HTTP Range（206）。
// Vite 內建靜態服務對 public 下的大檔不保證 byte-serving，會讓 sql.js-httpvfs
// 收到整檔（200）而讀到錯誤結果。此 middleware 補上 Range 支援。
function rangeSqlite() {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const url = (req.url || "").split("?")[0];
    if (!url.endsWith(".sqlite")) return next();
    const file = resolve(__dirname, "public", "." + url);
    let size: number;
    try {
      size = statSync(file).size;
    } catch {
      return next();
    }
    const r = res as ServerResponse;
    r.setHeader("Accept-Ranges", "bytes");
    r.setHeader("Content-Type", "application/octet-stream");
    if (req.method === "HEAD") {
      r.setHeader("Content-Length", size);
      r.statusCode = 200;
      return r.end();
    }
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m && m[1] ? parseInt(m[1], 10) : 0;
      let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
      if (Number.isNaN(end) || end >= size) end = size - 1;
      r.statusCode = 206;
      r.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
      r.setHeader("Content-Length", end - start + 1);
      createReadStream(file, { start, end }).pipe(r);
    } else {
      r.setHeader("Content-Length", size);
      createReadStream(file).pipe(r);
    }
  };
  return {
    name: "range-sqlite",
    configureServer(server: { middlewares: Connect.Server }) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: { middlewares: Connect.Server }) {
      server.middlewares.use(handler);
    },
  };
}

// 路線 A：純靜態。base 可在部署 GitHub Pages 時以 VITE_BASE 覆寫（如 "/CHCT/"）。
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react(), rangeSqlite()],
  // 須讓 esbuild 預打包 sql.js-httpvfs，否則 dev 模式下其 CJS 模組無法提供
  // createDbWorker 具名匯出（worker/wasm 仍由 new URL(...) 另行解析，不受影響）。
  optimizeDeps: { include: ["sql.js-httpvfs"] },
  worker: { format: "es" },
  server: { port: 5173 },
});

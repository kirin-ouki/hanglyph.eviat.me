// 正確支援 HTTP Range 的靜態伺服器（含 HEAD 回報 Accept-Ranges），
// 供本機預覽與 sql.js-httpvfs 使用。GitHub Pages 等正式靜態主機原生支援 Range。
// 用法：node scripts/serve.mjs [dir=dist] [port=4180]
import { createServer } from "node:http";
import { stat, open, readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const DIR = resolve(process.argv[2] || "dist");
const PORT = Number(process.argv[3] || 4180);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".sqlite": "application/octet-stream",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath.endsWith("/")) urlPath += "index.html";
    const filePath = join(DIR, normalize(urlPath).replace(/^(\.\.[/\\])+/, ""));
    let st;
    try {
      st = await stat(filePath);
    } catch {
      // SPA fallback
      const buf = await readFile(join(DIR, "index.html"));
      res.writeHead(200, { "Content-Type": TYPES[".html"] });
      return res.end(buf);
    }
    const type = TYPES[extname(filePath)] || "application/octet-stream";
    const headers = { "Content-Type": type, "Accept-Ranges": "bytes" };

    if (req.method === "HEAD") {
      res.writeHead(200, { ...headers, "Content-Length": st.size });
      return res.end();
    }

    const range = req.headers.range;
    const fh = await open(filePath);
    try {
      const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
      if (m && (m[1] || m[2])) {
        let start, end;
        if (!m[1]) {
          // 尾綴範圍 bytes=-N：最後 N 位元組
          start = Math.max(0, st.size - parseInt(m[2], 10));
          end = st.size - 1;
        } else {
          start = parseInt(m[1], 10);
          end = m[2] ? Math.min(parseInt(m[2], 10), st.size - 1) : st.size - 1;
        }
        if (start >= st.size || start > end) {
          res.writeHead(416, { ...headers, "Content-Range": `bytes */${st.size}` });
          return res.end();
        }
        const len = end - start + 1;
        const buf = Buffer.alloc(len);
        await fh.read(buf, 0, len, start);
        res.writeHead(206, {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${st.size}`,
          "Content-Length": len,
        });
        res.end(buf);
      } else {
        const buf = await fh.readFile();
        res.writeHead(200, { ...headers, "Content-Length": st.size });
        res.end(buf);
      }
    } finally {
      await fh.close();
    }
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});

server.listen(PORT, () => console.log(`[serve] ${DIR} -> http://localhost:${PORT}`));

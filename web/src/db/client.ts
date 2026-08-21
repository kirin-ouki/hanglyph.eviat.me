// 路線 A 核心：以 sql.js-httpvfs 在瀏覽器端對 char.sqlite 做「範圍請求」查詢，
// 不需後端、不需一次下載整個 42MB 檔案。
import { createDbWorker, type WorkerHttpvfs } from "sql.js-httpvfs";
import { inlineParams, type SqlValue } from "./sql";

// Vite 會把這兩個 new URL(...) 解析成可下載的資產 URL。
const workerUrl = new URL("sql.js-httpvfs/dist/sqlite.worker.js", import.meta.url);
const wasmUrl = new URL("sql.js-httpvfs/dist/sql-wasm.wasm", import.meta.url);

export type { SqlValue };

let workerPromise: Promise<WorkerHttpvfs> | null = null;

const CHUNK = 4096; // 對齊 SQLite 預設 page_size

// SplitFileConfig 沒有從套件根匯出，改由 createDbWorker 的參數型別取得。
type DbConfig = Parameters<typeof createDbWorker>[0][number];

/**
 * 以 1 byte 的 Range 請求取得檔案真實長度。
 *
 * 為什麼需要這個：GitHub Pages（Fastly）會對 char.sqlite 回應 `Content-Encoding: gzip`，
 * HEAD 拿到的 Content-Length 因此是「壓縮後」的大小。sql.js-httpvfs 的 checkServer
 * 偵測到 content-encoding 就會丟棄該長度，接著拋出
 * 「Length of the file not known. It must either be supplied in the config...」。
 * 本機 serve.mjs 不壓縮，所以這個問題只在線上出現。
 *
 * Range 回應不會被壓縮，且 `Content-Range: bytes 0-0/<total>` 直接帶有真實總長度。
 */
async function probeLength(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-0" } });
    const total = Number(res.headers.get("Content-Range")?.split("/")[1]);
    return Number.isFinite(total) && total > 0 ? total : null;
  } catch {
    return null;
  }
}

/**
 * serverMode "full" 沒有任何提供長度的參數，唯一的注入點是 chunked 模式的
 * databaseLengthBytes。這裡把它設定成「只有一個分塊」：serverChunkSize >= 檔案大小
 * 時分塊索引恆為 0，讀取行為與 full 模式完全相同。
 *
 * chunked 的 URL 組法是 `urlPrefix + 補零索引`，所以讓 urlPrefix 以 "?chunk=" 結尾，
 * 索引就落進查詢字串（→ `/data/char.sqlite?chunk=000`）。GitHub Pages、本機
 * serve.mjs 與 Vite middleware 都會忽略查詢字串而回傳同一個檔案，因此不需要真的
 * 把資料庫切割或改名。
 */
function makeConfig(url: string, total: number | null): DbConfig {
  if (total === null) {
    // 探測失敗時退回原本行為：伺服器若未壓縮仍可正常運作。
    return { from: "inline", config: { serverMode: "full", url, requestChunkSize: CHUNK } };
  }
  return {
    from: "inline",
    config: {
      serverMode: "chunked",
      urlPrefix: `${url}?chunk=`,
      suffixLength: 3,
      serverChunkSize: Math.ceil(total / CHUNK) * CHUNK,
      databaseLengthBytes: total,
      requestChunkSize: CHUNK,
    },
  };
}

export function getWorker(): Promise<WorkerHttpvfs> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const base = import.meta.env.BASE_URL || "/";
      const url = `${base}data/char.sqlite`;
      const config = makeConfig(url, await probeLength(url));
      return createDbWorker([config], workerUrl.toString(), wasmUrl.toString());
    })();
  }
  return workerPromise;
}

// Comlink 的 Remote 包裝會把 db.query 的泛型抹除並改回傳 Promise，故在此明確轉型。
// 參數安全內聯邏輯見 ./sql.ts（已抽出以便單元測試）。
type RemoteQuery = (sql: string, ...params: SqlValue[]) => Promise<unknown[]>;

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: SqlValue[] = [],
): Promise<T[]> {
  const w = await getWorker();
  const run = w.db.query as unknown as RemoteQuery;
  return (await run(inlineParams(sql, params))) as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: SqlValue[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length ? rows[0] : null;
}

/** 回報 httpvfs 至今已實際讀取的位元組數（用於顯示「已下載」）。 */
export async function bytesRead(): Promise<number> {
  const w = await getWorker();
  try {
    const worker = w.worker as unknown as { getStats?: () => Promise<{ totalBytes?: number }> };
    const stats = await worker.getStats?.();
    return stats?.totalBytes ?? 0;
  } catch {
    return 0;
  }
}

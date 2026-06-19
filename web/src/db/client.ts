// 路線 A 核心：以 sql.js-httpvfs 在瀏覽器端對 char.sqlite 做「範圍請求」查詢，
// 不需後端、不需一次下載整個 42MB 檔案。
import { createDbWorker, type WorkerHttpvfs } from "sql.js-httpvfs";
import { inlineParams, type SqlValue } from "./sql";

// Vite 會把這兩個 new URL(...) 解析成可下載的資產 URL。
const workerUrl = new URL("sql.js-httpvfs/dist/sqlite.worker.js", import.meta.url);
const wasmUrl = new URL("sql.js-httpvfs/dist/sql-wasm.wasm", import.meta.url);

export type { SqlValue };

let workerPromise: Promise<WorkerHttpvfs> | null = null;

export function getWorker(): Promise<WorkerHttpvfs> {
  if (!workerPromise) {
    const base = import.meta.env.BASE_URL || "/";
    workerPromise = createDbWorker(
      [
        {
          from: "inline",
          config: {
            serverMode: "full",
            url: `${base}data/char.sqlite`,
            requestChunkSize: 4096, // 對齊 SQLite 預設 page_size
          },
        },
      ],
      workerUrl.toString(),
      wasmUrl.toString(),
    );
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

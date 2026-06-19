// 純粹的 SQL 字面量內聯工具（無瀏覽器相依，方便單元測試）。
//
// 為何需要：此版 sql.js-httpvfs 的 `?` 參數綁定失效（實測 number/string/CAST 皆比對不到），
// 故改在客戶端把參數安全內聯為 SQLite 字面量。本資料庫唯讀、純前端，無伺服器注入風險。
export type SqlValue = string | number | null;

export function escapeLiteral(v: SqlValue): string {
  if (v === null) return "NULL";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error(`不合法的數值參數: ${v}`);
    return String(v);
  }
  return "'" + String(v).replace(/'/g, "''") + "'";
}

export function inlineParams(sql: string, params: SqlValue[]): string {
  let i = 0;
  const out = sql.replace(/\?/g, () => {
    if (i >= params.length) throw new Error("參數數量少於 ? 佔位符");
    return escapeLiteral(params[i++]);
  });
  if (i !== params.length) throw new Error("參數數量多於 ? 佔位符");
  return out;
}

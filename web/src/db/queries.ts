// 集中所有資料查詢。元件只呼叫這裡，不直接寫 SQL。
import { query, queryOne, type SqlValue } from "./client";
import { parseLookupInput } from "../lib/parse";
import type {
  BlockRow,
  CharacterRow,
  ComponentRow,
  ReadingRow,
  RomanizationRow,
  WuxingRow,
} from "./types";

export { parseLookupInput };

let blocksPromise: Promise<BlockRow[]> | null = null;
let radicalsPromise: Promise<ComponentRow[]> | null = null;
let componentsPromise: Promise<ComponentRow[]> | null = null;

export async function getBlocks(): Promise<BlockRow[]> {
  blocksPromise ??= query<BlockRow>("SELECT id, name_en, name_zh FROM blocks ORDER BY id");
  return blocksPromise;
}

/** 214 康熙部首：id（1–214）→ 部首字。用於把「№85」顯示成「水部」。 */
export async function getRadicals(): Promise<ComponentRow[]> {
  radicalsPromise ??= query<ComponentRow>("SELECT id, comp, stroke, freq FROM components_radical ORDER BY id");
  return radicalsPromise;
}

/** 標準部件 + 使用者自訂部件，用於「含部件」toggle 篩選。 */
export async function getComponents(): Promise<ComponentRow[]> {
  componentsPromise ??= query<ComponentRow>(
    `SELECT MIN(id) AS id, comp, MIN(stroke) AS stroke, MAX(freq) AS freq FROM (
       SELECT id, comp, stroke, freq FROM components_radical
       UNION ALL
       SELECT id, comp, stroke, freq FROM components_standard
       UNION ALL
       SELECT id, comp, stroke, freq FROM components_custom
     ) WHERE comp IS NOT NULL
     GROUP BY comp
     ORDER BY stroke IS NULL, stroke, id`,
  );
  return componentsPromise;
}

export interface BlockCoverage {
  block: number | null;
  count: number;
  lo: number | null; // 該區段本系統實際收錄的最小碼位
  hi: number | null; // ……最大碼位
}

/** 各 Unicode 區塊本系統實際收錄的字數與碼位範圍。 */
export async function getBlockCoverage(): Promise<BlockCoverage[]> {
  return query<BlockCoverage>(
    "SELECT block, COUNT(*) AS count, MIN(codepoint) AS lo, MAX(codepoint) AS hi " +
      "FROM characters GROUP BY block ORDER BY block",
  );
}

export async function getMeta(): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM meta");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function lookupCharacter(raw: string): Promise<CharacterRow | null> {
  const { codepoint } = parseLookupInput(raw);
  if (codepoint == null) return null;
  return queryOne<CharacterRow>(
    "SELECT * FROM characters WHERE codepoint = ? ORDER BY id LIMIT 1",
    [codepoint],
  );
}

export async function randomCharacters(limit = 3): Promise<CharacterRow[]> {
  const target = Math.max(0, Math.trunc(limit));
  if (!target) return [];

  const bounds = await queryOne<{ min_id: number | null; max_id: number | null }>(
    "SELECT MIN(id) AS min_id, MAX(id) AS max_id FROM characters",
  );
  if (bounds?.min_id == null || bounds.max_id == null) return [];

  const rows: CharacterRow[] = [];
  const seen = new Set<number>();
  const span = bounds.max_id - bounds.min_id + 1;
  const maxAttempts = target * 10;
  for (let attempts = 0; rows.length < target && attempts < maxAttempts; attempts += 1) {
    const id = bounds.min_id + Math.floor(Math.random() * span);
    const row = await queryOne<CharacterRow>(
      "SELECT * FROM characters WHERE id >= ? ORDER BY id LIMIT 1",
      [id],
    );
    if (row && !seen.has(row.id)) {
      seen.add(row.id);
      rows.push(row);
    }
  }

  if (rows.length < target) {
    const fallback = await query<CharacterRow>(
      `SELECT * FROM characters ORDER BY id LIMIT ?`,
      [target * 2],
    );
    for (const row of fallback) {
      if (rows.length >= target) break;
      if (!seen.has(row.id)) {
        seen.add(row.id);
        rows.push(row);
      }
    }
  }

  return rows;
}

export async function getReadings(charId: number): Promise<ReadingRow[]> {
  return query<ReadingRow>(
    "SELECT char_id, idx, bopomofo FROM readings WHERE char_id = ? ORDER BY idx",
    [charId],
  );
}

export async function romanize(bopomofoBase: string): Promise<RomanizationRow | null> {
  return queryOne<RomanizationRow>("SELECT * FROM romanization WHERE bopomofo = ?", [bopomofoBase]);
}

// ---- Phase 2：複合篩選 -----------------------------------------------------
export interface FilterCriteria {
  radical?: number | null;
  strokes?: number | null;
  wuxing?: number | null;
  block?: number | null;
  component?: string | null;
  components?: string[] | null;
  freqMin?: number | null;
  limit?: number;
}

const DEFAULT_FILTER_LIMIT = 4000;
const MAX_FILTER_LIMIT = 100000;

function normalizeFilterLimit(limit: number | undefined): number {
  const n = limit ?? DEFAULT_FILTER_LIMIT;
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid filter limit: ${limit}`);
  return Math.min(Math.trunc(n), MAX_FILTER_LIMIT);
}

function buildFilterParts(c: FilterCriteria): { join: string; whereSql: string; params: SqlValue[] } {
  const where: string[] = [];
  const params: SqlValue[] = [];
  let join = "";
  const components = Array.from(new Set([...(c.components ?? []), c.component ?? ""].filter(Boolean)));
  if (components.length === 1) {
    join = "JOIN char_components cc ON cc.char_id = ch.id";
    where.push("cc.component = ?");
    params.push(components[0]);
  } else if (components.length > 1) {
    where.push(
      `ch.id IN (
        SELECT char_id FROM char_components
        WHERE component IN (${components.map(() => "?").join(",")})
        GROUP BY char_id
        HAVING COUNT(*) = ?
      )`,
    );
    params.push(...components, components.length);
  }
  if (c.radical != null) {
    where.push("ch.radical_no = ?");
    params.push(c.radical);
  }
  if (c.strokes != null) {
    where.push("ch.stroke_total = ?");
    params.push(c.strokes);
  }
  if (c.wuxing != null) {
    where.push("ch.wuxing = ?");
    params.push(c.wuxing);
  }
  if (c.block != null) {
    where.push("ch.block = ?");
    params.push(c.block);
  }
  if (c.freqMin != null) {
    where.push("ch.freq_all >= ?");
    params.push(c.freqMin);
  }
  return {
    join,
    whereSql: where.length ? `WHERE ${where.join(" AND ")} ` : "",
    params,
  };
}

export async function filterCharacters(c: FilterCriteria): Promise<CharacterRow[]> {
  const { join, whereSql, params } = buildFilterParts(c);
  const limit = normalizeFilterLimit(c.limit);
  const sql =
    `SELECT ch.id, ch.char, ch.codepoint, ch.codepoint_hex, ch.block, ch.radical_no, ` +
    `ch.stroke_total, ch.wuxing, ch.freq_all FROM characters ch ${join} ` +
    whereSql +
    `ORDER BY ch.stroke_total IS NULL, ch.stroke_total, ch.codepoint LIMIT ?`;
  return query<CharacterRow>(sql, [...params, limit]);
}

export async function countFilter(c: FilterCriteria): Promise<number> {
  const { join, whereSql, params } = buildFilterParts(c);
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(DISTINCT ch.id) AS count FROM characters ch ${join} ${whereSql}`,
    params,
  );
  return row?.count ?? 0;
}

// ---- Phase 3：康熙釋義全文檢索（FTS5，失敗則退回 LIKE）---------------------
export interface FtsHit {
  id: number;
  char: string;
  codepoint_hex: string;
  snippet: string;
}

export async function fullTextSearch(term: string, limit = 60): Promise<FtsHit[]> {
  const t = term.trim();
  if (!t) return [];
  try {
    return await query<FtsHit>(
      `SELECT c.id, c.char, c.codepoint_hex,
              snippet(characters_fts, 0, '[', ']', ' … ', 12) AS snippet
       FROM characters_fts f JOIN characters c ON c.id = f.rowid
       WHERE characters_fts MATCH ? ORDER BY rank LIMIT ?`,
      [t, limit],
    );
  } catch {
    // 退回 LIKE（無 FTS5 時）
    return query<FtsHit>(
      `SELECT id, char, codepoint_hex, substr(kangxi_text,1,80) AS snippet
       FROM characters WHERE kangxi_text LIKE ? LIMIT ?`,
      [`%${t}%`, limit],
    );
  }
}

// ---- 篩選面板選項 ----------------------------------------------------------
export async function distinctStrokes(): Promise<number[]> {
  const rows = await query<{ s: number }>(
    "SELECT DISTINCT stroke_total AS s FROM characters WHERE stroke_total IS NOT NULL ORDER BY s",
  );
  return rows.map((r) => r.s);
}

export async function getWuxingRows(): Promise<WuxingRow[]> {
  return query<WuxingRow>("SELECT id, name_en, name_zh FROM wuxing ORDER BY id");
}

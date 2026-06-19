// 集中所有資料查詢。元件只呼叫這裡，不直接寫 SQL。
import { query, queryOne, type SqlValue } from "./client";
import { parseLookupInput } from "../lib/parse";
import type {
  BlockRow,
  CharacterRow,
  ReadingRow,
  RomanizationRow,
  WuxingRow,
} from "./types";

export { parseLookupInput };

export async function getBlocks(): Promise<BlockRow[]> {
  return query<BlockRow>("SELECT id, name_en, name_zh FROM blocks ORDER BY id");
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
  freqMin?: number | null;
  limit?: number;
}

export async function filterCharacters(c: FilterCriteria): Promise<CharacterRow[]> {
  const where: string[] = [];
  const params: SqlValue[] = [];
  let join = "";
  if (c.component) {
    join = "JOIN char_components cc ON cc.char_id = ch.id";
    where.push("cc.component = ?");
    params.push(c.component);
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
  const limit = c.limit ?? 4000;
  const sql =
    `SELECT ch.id, ch.char, ch.codepoint, ch.codepoint_hex, ch.block, ch.radical_no, ` +
    `ch.stroke_total, ch.wuxing, ch.freq_all FROM characters ch ${join} ` +
    (where.length ? `WHERE ${where.join(" AND ")} ` : "") +
    `ORDER BY ch.stroke_total IS NULL, ch.stroke_total, ch.codepoint LIMIT ${limit}`;
  return query<CharacterRow>(sql, params);
}

export async function countFilter(c: FilterCriteria): Promise<number> {
  const full = await filterCharacters({ ...c, limit: 100000 });
  return full.length;
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

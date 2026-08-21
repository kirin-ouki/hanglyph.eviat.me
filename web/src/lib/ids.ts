// IDS（表意文字描述序列）解析與遞迴拆分。對應原程式 C_CHARTextBox_TextChanged 的拆解邏輯。
import { query } from "../db/client";

const IDS_OP_LO = 0x2ff0;
const IDS_OP_HI = 0x2fff;
const ENTITY_RE = /(&[^;\s]+;)/;

export function isIdsOperator(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return cp >= IDS_OP_LO && cp <= IDS_OP_HI;
}

/** 從 IDS 字串解析出直接部件 token（去結構運算子，&entity; 視為單一部件，去自身）。 */
export function parseComponents(ids: string | null, selfChar?: string): string[] {
  if (!ids) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const part of ids.split(ENTITY_RE)) {
    if (!part) continue;
    let cands: string[];
    if (part.startsWith("&") && part.endsWith(";")) {
      cands = [part];
    } else {
      cands = [];
      for (const ch of Array.from(part)) {
        if (isIdsOperator(ch) || ch.trim() === "") continue;
        cands.push(ch);
      }
    }
    for (const t of cands) {
      if (selfChar && t === selfChar) continue;
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
  }
  return out;
}

export function isEntity(token: string): boolean {
  return token.startsWith("&") && token.endsWith(";");
}

export interface IdsNode {
  token: string; // 部件（字或 &CDP-...;）
  ids: string | null; // 該部件自身的 IDS
  isEntity: boolean;
  children: IdsNode[];
}

/** 遞迴拆分一個字，回傳樹狀結構。以「祖先鏈」防環（同部件可在不同分支各自展開）、maxDepth 防爆。 */
export async function decompose(char: string, maxDepth = 8): Promise<IdsNode> {
  const idsCache = new Map<string, string | null>();

  async function build(token: string, depth: number, ancestors: Set<string>): Promise<IdsNode> {
    const entity = isEntity(token);
    const node: IdsNode = { token, ids: null, isEntity: entity, children: [] };
    if (entity || depth >= maxDepth || ancestors.has(token)) return node;

    let ids = idsCache.get(token);
    if (ids === undefined) {
      const rows = await query<{ ids: string | null }>(
        "SELECT ids FROM characters WHERE char = ? LIMIT 1",
        [token],
      );
      ids = rows[0]?.ids ?? null;
      idsCache.set(token, ids);
    }
    node.ids = ids;
    const nextAncestors = new Set(ancestors).add(token);
    for (const c of parseComponents(ids, token)) {
      node.children.push(await build(c, depth + 1, nextAncestors));
    }
    return node;
  }

  return build(char, 0, new Set());
}

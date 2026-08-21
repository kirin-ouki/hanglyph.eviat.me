// UI 常數。羅馬化系統「以 romanization 資料表的欄位名為準」——
// 修正原桌面程式中「系統名稱 → 取用欄位」對照錯位的 bug（見 AI_IMPLEMENTATION.md §4.3）。
import type { RomanizationRow } from "../db/types";

export interface RomSystem {
  col: keyof RomanizationRow; // romanization 表欄位
  zh: string;
  en: string;
}

// 注音本身永遠顯示；其餘為可選的羅馬化系統。
export const ROM_SYSTEMS: RomSystem[] = [
  { col: "hanyu_pinyin", zh: "漢語拼音", en: "Hanyu Pinyin" },
  { col: "wade_giles", zh: "威妥瑪拼音", en: "Wade–Giles" },
  { col: "tongyong", zh: "通用拼音", en: "Tongyong" },
  { col: "mps2", zh: "注音第二式", en: "MPS II" },
  { col: "yale", zh: "耶魯拼音", en: "Yale" },
  { col: "efeo", zh: "法國遠東學院", en: "EFEO" },
  { col: "lessing_othmer", zh: "德國式拼音", en: "Lessing–Othmer" },
  { col: "ipa", zh: "國際音標", en: "IPA" },
];

// 五行（對應 wuxing 表 id）。
export const WUXING: Record<number, { zh: string; en: string; color: string }> = {
  1: { zh: "金", en: "Metal", color: "#d4af37" },
  2: { zh: "木", en: "Wood", color: "#4caf50" },
  3: { zh: "水", en: "Water", color: "#2196f3" },
  4: { zh: "火", en: "Fire", color: "#f44336" },
  5: { zh: "土", en: "Earth", color: "#8d6e63" },
};

// Unicode CJK 表意文字區塊的官方碼位範圍。
// id 對應 char.sqlite 的 blocks 表 / characters.block 欄位；
// inSystem=false 者為本資料集（2017 來源）尚未收錄的後期擴展（Unicode 13.0 起新增）。
//
// 兩種「總量」要分清：
//   capacity（end−start+1）＝區段碼位數，版本無關、可驗證；本系統採逐區段列舉，
//     故以此為覆蓋率分母（若用 assigned 當分母，區段未填滿者會 >100%）。
//   assigned＝Unicode 17.0（2025）各區實際指派的漢字數；含歷年「零碎追加」
//     （如基本區的 U+9Fxx、擴展 C 末端 U+2B73A–U+2B73F 等），數字取自中文維基百科
//     「中日韓統一表意文字」條目的版本沿革。
export interface CjkBlockMeta {
  id: number | null; // blocks 表 id；未收錄者為 null
  abbr: string;
  zh: string;
  en: string;
  start: number; // 起始碼位（含）
  end: number; // 結束碼位（含）
  assigned: number; // Unicode 17.0 實際指派字數
  firstVer: string; // 首次納入 Unicode 的版本
  lastVer: string; // 最近一次補字的版本（同 firstVer 表一次到位）
  inSystem: boolean;
}

export const CJK_BLOCKS: CjkBlockMeta[] = [
  { id: 0, abbr: "URO", zh: "中日韓統一表意文字", en: "CJK Unified Ideographs", start: 0x4e00, end: 0x9fff, assigned: 20992, firstVer: "1.1", lastVer: "14.0", inSystem: true },
  { id: 1, abbr: "Ext A", zh: "統一表意文字擴展 A", en: "Unified Ideographs Ext A", start: 0x3400, end: 0x4dbf, assigned: 6592, firstVer: "3.0", lastVer: "13.0", inSystem: true },
  { id: 2, abbr: "Ext B", zh: "統一表意文字擴展 B", en: "Unified Ideographs Ext B", start: 0x20000, end: 0x2a6df, assigned: 42720, firstVer: "3.1", lastVer: "14.0", inSystem: true },
  { id: 3, abbr: "Ext C", zh: "統一表意文字擴展 C", en: "Unified Ideographs Ext C", start: 0x2a700, end: 0x2b73f, assigned: 4160, firstVer: "5.2", lastVer: "17.0", inSystem: true },
  { id: 4, abbr: "Ext D", zh: "統一表意文字擴展 D", en: "Unified Ideographs Ext D", start: 0x2b740, end: 0x2b81f, assigned: 222, firstVer: "6.0", lastVer: "6.0", inSystem: true },
  { id: 5, abbr: "Ext E", zh: "統一表意文字擴展 E", en: "Unified Ideographs Ext E", start: 0x2b820, end: 0x2ceaf, assigned: 5774, firstVer: "8.0", lastVer: "17.0", inSystem: true },
  { id: 6, abbr: "Ext F", zh: "統一表意文字擴展 F", en: "Unified Ideographs Ext F", start: 0x2ceb0, end: 0x2ebef, assigned: 7473, firstVer: "10.0", lastVer: "10.0", inSystem: true },
  { id: 11, abbr: "Compat", zh: "相容表意文字", en: "Compatibility Ideographs", start: 0xf900, end: 0xfaff, assigned: 472, firstVer: "1.1", lastVer: "3.2", inSystem: true },
  { id: 12, abbr: "Compat Supp.", zh: "相容表意文字增補", en: "Compatibility Ideographs Supplement", start: 0x2f800, end: 0x2fa1f, assigned: 542, firstVer: "3.1", lastVer: "3.1", inSystem: true },
  // ── 後期擴展：由 data/ingest_ext.py 自 Unicode 17.0 Unihan 補入（id 7–10）──
  { id: 7, abbr: "Ext G", zh: "統一表意文字擴展 G", en: "Unified Ideographs Ext G", start: 0x30000, end: 0x3134f, assigned: 4939, firstVer: "13.0", lastVer: "13.0", inSystem: true },
  { id: 8, abbr: "Ext H", zh: "統一表意文字擴展 H", en: "Unified Ideographs Ext H", start: 0x31350, end: 0x323af, assigned: 4192, firstVer: "15.0", lastVer: "15.0", inSystem: true },
  { id: 9, abbr: "Ext I", zh: "統一表意文字擴展 I", en: "Unified Ideographs Ext I", start: 0x2ebf0, end: 0x2ee5f, assigned: 622, firstVer: "15.1", lastVer: "15.1", inSystem: true },
  { id: 10, abbr: "Ext J", zh: "統一表意文字擴展 J", en: "Unified Ideographs Ext J", start: 0x323b0, end: 0x33479, assigned: 4298, firstVer: "17.0", lastVer: "17.0", inSystem: true },
];

/** 區段碼位數（含頭尾）。 */
export const cjkBlockCapacity = (b: CjkBlockMeta): number => b.end - b.start + 1;

/** 碼位 → U+XXXX（至少 4 位）。 */
export const toHex = (cp: number): string => "U+" + cp.toString(16).toUpperCase().padStart(4, "0");

// 注音聲調符號（第一聲不標）。對應原程式 IsPron()。
export const TONE_MARKS = ["ˊ", "ˇ", "ˋ", "˙"];
export const TONE_NUMBER: Record<string, string> = { ˊ: "2", ˇ: "3", ˋ: "4", "˙": "5" };

export interface ToneSplit {
  base: string;
  tone: string;
}

export function splitTone(bopomofo: string): ToneSplit {
  // 輕聲的標準正字法寫在音節前（˙ㄇㄚ）；本資料庫存為尾綴（ㄇㄚ˙）。兩者皆接受。
  if (bopomofo.startsWith("˙")) return { base: bopomofo.slice(1), tone: "˙" };
  const last = bopomofo.slice(-1);
  if (TONE_MARKS.includes(last)) return { base: bopomofo.slice(0, -1), tone: last };
  return { base: bopomofo, tone: "" };
}

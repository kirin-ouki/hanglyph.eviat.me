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

// 注音聲調符號（第一聲不標）。對應原程式 IsPron()。
export const TONE_MARKS = ["ˊ", "ˇ", "ˋ", "˙"];
export const TONE_NUMBER: Record<string, string> = { ˊ: "2", ˇ: "3", ˋ: "4", "˙": "5" };

export interface ToneSplit {
  base: string;
  tone: string;
}

export function splitTone(bopomofo: string): ToneSplit {
  const last = bopomofo.slice(-1);
  if (TONE_MARKS.includes(last)) return { base: bopomofo.slice(0, -1), tone: last };
  return { base: bopomofo, tone: "" };
}

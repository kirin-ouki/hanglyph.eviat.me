// 極簡 i18n：繁體中文（預設）/ English。
import { createContext, useContext } from "react";

export type Lang = "zh" | "en";

export const STRINGS = {
  appTitle: { zh: "HanGlyph · 現代漢字資料工具", en: "HanGlyph · Modern Han Character Explorer" },
  tagline: {
    zh: "字元查詢 · 部件拆分 · 多系統拼音 · 康熙釋義 · 字集匯出",
    en: "Lookup · IDS decomposition · romanization · Kangxi text · character-set export",
  },
  nav_lookup: { zh: "查字", en: "Lookup" },
  nav_filter: { zh: "篩選", en: "Filter" },
  nav_search: { zh: "釋義檢索", en: "Text search" },
  nav_convert: { zh: "拼音轉換", en: "Romanize" },
  nav_blocks: { zh: "區塊涵蓋", en: "Blocks" },
  nav_about: { zh: "關於", en: "About" },
  theme_toggle: { zh: "切換深色 / 淺色模式", en: "Switch light / dark mode" },
  theme_light: { zh: "淺色", en: "Light" },
  theme_dark: { zh: "深色", en: "Dark" },

  blocks_title: { zh: "CJK 區塊涵蓋率", en: "CJK block coverage" },
  blocks_stat_collected: { zh: "本系統總收錄", en: "Total collected" },
  blocks_stat_blocks: { zh: "已涵蓋區塊", en: "Blocks covered" },
  blocks_stat_universe: { zh: "佔全部 CJK", en: "Of all CJK" },
  blocks_stat_within: { zh: "已涵蓋區塊內完整度", en: "Within covered blocks" },
  blocks_all_blocks: { zh: "全部 13 區塊", en: "All 13 blocks" },
  blocks_theoretical: { zh: "（理論最大）", en: "(theoretical max)" },
  blocks_col_block: { zh: "區塊", en: "Block" },
  blocks_col_range: { zh: "碼位範圍", en: "Range" },
  blocks_col_assigned: { zh: "Unicode 收字", en: "Assigned" },
  blocks_col_capacity: { zh: "區段碼位", en: "Codepoints" },
  blocks_col_collected: { zh: "本系統收錄", en: "Collected" },
  blocks_col_coverage: { zh: "完整度", en: "Coverage" },
  blocks_total: { zh: "合計", en: "Total" },
  blocks_uncovered: { zh: "未收錄", en: "Not collected" },
  blocks_scattered_h: { zh: "零碎追加", en: "Scattered additions" },

  loading_db: { zh: "正在連線字元資料庫…", en: "Connecting to the character database…" },
  db_missing: {
    zh: "找不到 char.sqlite。請在專案根目錄執行 python data/migrate.py，再 npm run dev。",
    en: "char.sqlite not found. Run `python data/migrate.py` then `npm run dev`.",
  },

  search_placeholder: { zh: "輸入一個漢字、U+XXXX 或十進位碼位", en: "A character, U+XXXX, or decimal codepoint" },
  search_btn: { zh: "查詢", en: "Search" },
  not_found: { zh: "查無此字。", en: "No matching character." },
  lookup_random_title: { zh: "隨機三字", en: "Three random characters" },
  lookup_random_loading: { zh: "正在抽取隨機字…", en: "Picking random characters…" },

  field_codepoint: { zh: "碼位", en: "Codepoint" },
  field_block: { zh: "字區", en: "Block" },
  field_radical: { zh: "部首", en: "Radical" },
  field_strokes: { zh: "總筆畫", en: "Strokes" },
  strokes_other_label: { zh: "部首外", en: "non-radical" },
  field_variant: { zh: "異體 / 簡化", en: "Variant" },
  field_wuxing: { zh: "五行", en: "Wǔxíng" },
  field_freq: { zh: "頻率分級", en: "Frequency" },
  freq_lbl_all: { zh: "全", en: "All" },
  freq_lbl_trad: { zh: "繁", en: "Trad." },
  freq_lbl_simp: { zh: "簡", en: "Simp." },
  field_readings: { zh: "讀音", en: "Readings" },
  field_romanization: { zh: "多系統拼音", en: "Romanization" },
  field_kangxi_loc: { zh: "康熙出處", en: "Kangxi location" },
  field_kangxi_text: { zh: "康熙字典釋義", en: "Kangxi dictionary entry" },
  field_decomp: { zh: "部件拆分", en: "Decomposition" },
  field_ids: { zh: "IDS", en: "IDS" },
  field_ids_legacy: { zh: "舊部件", en: "Legacy IDS" },
  no_data: { zh: "（無資料）", en: "(no data)" },

  filter_radical: { zh: "康熙部首", en: "Radical" },
  filter_strokes: { zh: "總筆畫", en: "Strokes" },
  filter_wuxing: { zh: "五行", en: "Wǔxíng" },
  filter_block: { zh: "字區", en: "Block" },
  filter_component: { zh: "含部件", en: "Contains component" },
  filter_freq: { zh: "頻率 ≥", en: "Frequency ≥" },
  filter_run: { zh: "查詢", en: "Run" },
  filter_clear: { zh: "清除", en: "Clear" },
  filter_auto_waiting: { zh: "條件變動時會自動更新結果。", en: "Results update automatically as filters change." },
  result_count: { zh: "筆結果", en: "results" },
  export_btn: { zh: "匯出字集", en: "Export set" },
  export_sep: { zh: "分隔符", en: "Separator" },
  export_only_supported: { zh: "僅匯出目前字型支援的字", en: "Only font-supported chars" },
  font_family: { zh: "顯示字型", en: "Display font" },
  copy: { zh: "複製", en: "Copy" },
  copied: { zh: "已複製", en: "Copied" },
  download: { zh: "下載 .txt", en: "Download .txt" },

  fts_placeholder: { zh: "在康熙字典釋義全文中檢索（如：說文、水也）", en: "Full-text search Kangxi entries" },
  convert_input: { zh: "輸入注音（每行一個音節，可帶聲調）", en: "Bopomofo, one syllable per line" },

} as const;

export type StringKey = keyof typeof STRINGS;

export const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "zh",
  setLang: () => {},
});

export function useI18n() {
  const { lang, setLang } = useContext(I18nContext);
  const t = (key: StringKey) => STRINGS[key][lang];
  return { lang, setLang, t };
}

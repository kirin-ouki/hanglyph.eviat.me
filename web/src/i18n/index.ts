// 極簡 i18n：繁體中文（預設）/ English。
import { createContext, useContext } from "react";

export type Lang = "zh" | "en";

export const STRINGS = {
  appTitle: { zh: "CHCT · 中文字元工具", en: "CHCT · Chinese Character Tool" },
  tagline: {
    zh: "近九萬字的查詢 · 部件拆分 · 多系統拼音 · 康熙釋義 · 字集匯出",
    en: "Lookup · IDS decomposition · romanization · Kangxi text · set export for ~89k characters",
  },
  nav_lookup: { zh: "查字", en: "Lookup" },
  nav_filter: { zh: "篩選", en: "Filter" },
  nav_search: { zh: "釋義檢索", en: "Text search" },
  nav_convert: { zh: "拼音轉換", en: "Romanize" },
  nav_about: { zh: "關於", en: "About" },

  loading_db: { zh: "正在連線字元資料庫…", en: "Connecting to the character database…" },
  db_missing: {
    zh: "找不到 char.sqlite。請在專案根目錄執行 python data/migrate.py，再 npm run dev。",
    en: "char.sqlite not found. Run `python data/migrate.py` then `npm run dev`.",
  },

  search_placeholder: { zh: "輸入一個漢字、U+XXXX 或十進位碼位", en: "A character, U+XXXX, or decimal codepoint" },
  search_btn: { zh: "查詢", en: "Search" },
  not_found: { zh: "查無此字。", en: "No matching character." },

  field_codepoint: { zh: "碼位", en: "Codepoint" },
  field_block: { zh: "字區", en: "Block" },
  field_radical: { zh: "部首", en: "Radical" },
  field_strokes: { zh: "總筆畫", en: "Strokes" },
  field_wuxing: { zh: "五行", en: "Wǔxíng" },
  field_freq: { zh: "頻率分級", en: "Frequency" },
  field_readings: { zh: "讀音", en: "Readings" },
  field_romanization: { zh: "多系統拼音", en: "Romanization" },
  field_kangxi_loc: { zh: "康熙出處", en: "Kangxi location" },
  field_kangxi_text: { zh: "康熙字典釋義", en: "Kangxi dictionary entry" },
  field_decomp: { zh: "部件拆分", en: "Decomposition" },
  field_ids: { zh: "IDS", en: "IDS" },
  no_data: { zh: "（無資料）", en: "(no data)" },

  filter_radical: { zh: "康熙部首", en: "Radical" },
  filter_strokes: { zh: "總筆畫", en: "Strokes" },
  filter_wuxing: { zh: "五行", en: "Wǔxíng" },
  filter_block: { zh: "字區", en: "Block" },
  filter_component: { zh: "含部件", en: "Contains component" },
  filter_freq: { zh: "頻率 ≥", en: "Frequency ≥" },
  filter_run: { zh: "查詢", en: "Run" },
  filter_clear: { zh: "清除", en: "Clear" },
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

  hanamin_label: { zh: "罕用字字型", en: "Rare-char font" },
  hanamin_title: {
    zh: "啟用花園明朝 HanaMin（首次開啟需下載約 31MB+，補齊系統缺字）",
    en: "Enable HanaMin font (first use downloads ~31MB+, fills missing glyphs)",
  },
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

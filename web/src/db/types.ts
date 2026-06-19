// 對應 data/dist/char.sqlite 的列型別（見 DATA.md）。

export interface CharacterRow {
  id: number;
  char: string;
  codepoint: number;
  codepoint_hex: string;
  block: number | null;
  radical_no: number | null;
  stroke_total: number | null;
  stroke_other: number | null;
  wuxing: number | null;
  freq_all: number | null;
  freq_trad: number | null;
  freq_simp: number | null;
  kangxi_loc: string | null;
  kangxi_text: string | null;
  ids: string | null;
  ids_legacy: string | null;
  var_sc: number | null;
  var_tt: number | null;
  var_tsr: string | null;
  reading_a: string | null;
  reading_b: string | null;
}

export interface ReadingRow {
  char_id: number;
  idx: number;
  bopomofo: string;
}

export interface RomanizationRow {
  bopomofo: string;
  wade_giles: string | null;
  mps2: string | null;
  yale: string | null;
  tongyong: string | null;
  hanyu_pinyin: string | null;
  efeo: string | null;
  lessing_othmer: string | null;
  gr1: string | null;
  gr2: string | null;
  gr3: string | null;
  gr4: string | null;
  ipa: string | null;
}

export interface BlockRow {
  id: number;
  name_en: string;
  name_zh: string;
}

export interface WuxingRow {
  id: number;
  name_en: string;
  name_zh: string;
}

export interface ComponentRow {
  id: number;
  comp: string;
  stroke: number | null;
  freq: number | null;
}

// 補字字型支援。為避免每次載入硬塞數十 MB 字型，採 unicode-range 分檔：@font-face 規則
// 一律注入（不耗流量），瀏覽器只有在「實際要顯示」該範圍的字時才下載對應檔。
// @font-face 的 URL 需隨 Vite base 變動，故以 JS 動態注入（CSS 無法取得 BASE_URL）。
//
// 字型分工（皆黑體，視覺一致）：
//   Noto Sans CJK / 思源黑體（OFL-1.1）─ BMP CJK（URO/Ext A/相容/部首），即「正常」的底。
//     以 src: local() 優先採用使用者已安裝者，未裝者才下載自帶子集（約 4.7MB，見 setup-noto.py）。
//   Plangothic（屏黑，黑體，OFL-1.1）  ─ Ext B–J，含第 3 平面 G/H/J（思源黑體未收）。
//   HanaMin（花園明朝，明體）          ─ 僅作康熙釋義（serif）的罕用字後備，見 styles.css .kangxi。
// Plangothic 的分檔覆蓋由 web/scripts/inspect-plangothic.py 實測 cmap 得出：
//   P1 = 第 2 平面 CJK（Ext B–F、I、相容增補）；P2 = 第 3 平面 CJK（Ext G/H/J）。
// P1 的 unicode-range 含 Ext B（U+20000 起）：雖與 HanaMin B 範圍重疊，但堆疊順序 Plangothic
//   在前，故 Ext B–J 一律以 Plangothic（黑體）顯示，避免 Ext B 落到 HanaMin（明體）造成
//   同一畫面襯線／非襯線混排。BMP 常用字 Plangothic 多未收，仍走系統字型。

const STYLE_ID = "chct-fill-fontface";
const GENERIC_FONT_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
]);

export function cssFontFamilyName(family: string): string {
  const name = family.trim();
  if (!name) return "sans-serif";
  if (GENERIC_FONT_FAMILIES.has(name.toLowerCase())) return name;
  return `"${name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function installFillFontFaces(): void {
  if (document.getElementById(STYLE_ID)) return;
  const base = import.meta.env.BASE_URL || "/";
  const css = `
@font-face {
  font-family: "Noto Sans CJK Fill";
  src: local("Noto Sans CJK TC"), local("Source Han Sans TC"), local("Source Han Sans TC Regular"),
       url("${base}fonts/NotoSansCJKtc-cjkbmp.woff2") format("woff2");
  font-display: swap;
  unicode-range: U+2E80-2EFF, U+2F00-2FDF, U+2FF0-2FFF, U+3000-303F, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF;
}
@font-face {
  font-family: "HanaMin";
  src: url("${base}fonts/HanaMinA.otf") format("opentype");
  font-display: swap;
  unicode-range: U+2E80-2EFF, U+3001-303F, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF;
}
@font-face {
  font-family: "HanaMin";
  src: url("${base}fonts/HanaMinB.otf") format("opentype");
  font-display: swap;
  unicode-range: U+20000-2A6DF;
}
@font-face {
  font-family: "Plangothic";
  src: url("${base}fonts/PlangothicP1-Regular.ttf") format("truetype");
  font-display: swap;
  unicode-range: U+20000-2EE5F, U+2F800-2FA1F;
}
@font-face {
  font-family: "Plangothic";
  src: url("${base}fonts/PlangothicP2-Regular.ttf") format("truetype");
  font-display: swap;
  unicode-range: U+30000-33479;
}`;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = css;
  document.head.appendChild(el);
}

// 補字顯示堆疊（接在使用者指定字型之後）。全為黑體，視覺一致。順序：
//   思源黑體 / Noto Sans CJK（BMP CJK；含本地與自帶子集後備）
//   → 系統 CJK 黑體（保險）
//   → Plangothic（Ext B–J，BMP 未收故不會誤觸發下載）
//   → 泛用 sans-serif。靠 unicode-range 惰性下載，僅在畫面出現該範圍的字時才取檔。
export const FILL_FONT_STACK =
  '"Noto Sans CJK Fill", "Source Han Sans TC", "Noto Sans CJK TC", "PingFang TC", "Microsoft JhengHei", "Plangothic", sans-serif';

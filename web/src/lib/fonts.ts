// HanaMin（花園明朝）字型支援。為避免每次載入硬塞數十 MB 字型，
// 採「使用者開啟才注入 @font-face」+ unicode-range 分檔（Ext B 字才會下載 B 檔）。
// @font-face 的 URL 需隨 Vite base 變動，故以 JS 動態注入（CSS 無法取得 BASE_URL）。

const STYLE_ID = "chct-hanamin-fontface";

export function installHanaMinFontFaces(): void {
  if (document.getElementById(STYLE_ID)) return;
  const base = import.meta.env.BASE_URL || "/";
  const css = `
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
}`;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = css;
  document.head.appendChild(el);
}

export function setHanaMinEnabled(enabled: boolean): void {
  if (enabled) installHanaMinFontFaces();
  document.documentElement.classList.toggle("use-hanamin", enabled);
}

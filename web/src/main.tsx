import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { installFillFontFaces } from "./lib/fonts";

// 一律注入補字字型的 @font-face：靠 unicode-range 惰性下載，未顯示該範圍的字前不耗流量。
// 字形／字元格／匯出框等以 FILL_FONT_STACK 為後備，系統缺的 Ext B–J 罕用字即自動補上。
installFillFontFaces();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

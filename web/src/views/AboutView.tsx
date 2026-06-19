import { useEffect, useState } from "react";
import { getMeta } from "../db/queries";
import { useI18n } from "../i18n";

export function AboutView() {
  const { lang } = useI18n();
  const [meta, setMeta] = useState<Record<string, string>>({});
  useEffect(() => {
    getMeta().then(setMeta);
  }, []);

  return (
    <div className="panel card" style={{ lineHeight: 1.8 }}>
      {lang === "zh" ? (
        <>
          <h2>關於 CHCT</h2>
          <p>
            CHCT（中文字元工具）源自 2017 年的 WPF 桌面程式，現以「路線 A」重建為純前端、
            瀏覽器端 SQLite 的開源 Web 應用：近九萬個 CJK 字元的查詢、IDS 部件拆分、
            多系統羅馬拼音、康熙字典釋義全文檢索與字集匯出。
          </p>
          <h3>資料</h3>
          <ul>
            <li>characters：88,966 字（統一表意文字 + 擴展 A–F + 相容區）</li>
            <li>romanization：411 注音音節 × 8+ 羅馬化系統（含 IPA、國語羅馬字）</li>
            <li>康熙字典釋義、IDS 拆分、部首/筆畫、五行、頻率分級</li>
          </ul>
          <h3>⚠ 資料來源與授權</h3>
          <p>
            康熙字典原典屬公有領域；Unicode 衍生欄位授權寬鬆；
            <b>注音／各系統羅馬化／頻率資料來源尚待確認</b>，開源散布前務必釐清。
            詳見專案根目錄的 <code>DATA.md</code> 與 <code>AI_IMPLEMENTATION.md</code>。
          </p>
          <h3>技術</h3>
          <p>Vite + React + TypeScript + sql.js-httpvfs（HTTP 範圍請求查詢，不需後端）。程式碼採 MIT。</p>
        </>
      ) : (
        <>
          <h2>About CHCT</h2>
          <p>
            CHCT (Chinese Character Tool) began as a 2017 WPF desktop app, now rebuilt as a
            zero-backend, browser-side-SQLite open-source web app: lookup, IDS decomposition,
            multi-system romanization, Kangxi full-text search and character-set export for ~89k CJK characters.
          </p>
          <h3>Data</h3>
          <ul>
            <li>characters: 88,966 (Unified + Ext A–F + Compatibility)</li>
            <li>romanization: 411 syllables × 8+ systems (incl. IPA, Gwoyeu Romatzyh)</li>
            <li>Kangxi entries, IDS decomposition, radical/strokes, wǔxíng, frequency</li>
          </ul>
          <h3>⚠ Sources &amp; licensing</h3>
          <p>
            Kangxi text is public domain; Unicode-derived fields are permissive;
            <b> provenance of readings / romanization / frequency is unconfirmed</b> — clear before redistribution.
            See <code>DATA.md</code> and <code>AI_IMPLEMENTATION.md</code>.
          </p>
          <h3>Stack</h3>
          <p>Vite + React + TypeScript + sql.js-httpvfs. Code under MIT.</p>
        </>
      )}
      <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "16px 0" }} />
      <p className="muted" style={{ fontSize: 13 }}>
        {meta.generated_at && `dataset generated ${meta.generated_at} · schema ${meta.schema_version}`}
      </p>
    </div>
  );
}

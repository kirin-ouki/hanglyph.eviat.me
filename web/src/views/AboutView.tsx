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
          <h2>關於 HanGlyph</h2>
          <p>
            HanGlyph 源自 2017 年 CHCT（中文字元工具）WPF 桌面程式的資料與核心想法，
            現以「路線 A」重建為純前端、
            瀏覽器端 SQLite 的開源 Web 應用：CJK 字元的查詢、IDS 部件拆分、
            多系統羅馬拼音、康熙字典釋義全文檢索與字集匯出。
          </p>
          <h3>資料</h3>
          <ul>
            <li>字元涵蓋：統一表意文字、擴展 A–J、相容表意文字</li>
            <li>注音 × 8+ 羅馬化系統（含 IPA、國語羅馬字）</li>
            <li>康熙字典釋義、IDS 拆分、部首/筆畫、五行、頻率分級</li>
          </ul>
          <h3>技術</h3>
          <p>Vite + React + TypeScript + sql.js-httpvfs（HTTP 範圍請求查詢，不需後端）。程式碼採 MIT。</p>
        </>
      ) : (
        <>
          <h2>About HanGlyph</h2>
          <p>
            HanGlyph grows from the data and core ideas of CHCT, a 2017 WPF Chinese Character Tool,
            now rebuilt as a
            zero-backend, browser-side-SQLite open-source web app: lookup, IDS decomposition,
            multi-system romanization, Kangxi full-text search and character-set export for CJK ideographs.
          </p>
          <h3>Data</h3>
          <ul>
            <li>Coverage: Unified Ideographs, Ext A–J, Compatibility</li>
            <li>Bopomofo × 8+ romanization systems (incl. IPA, Gwoyeu Romatzyh)</li>
            <li>Kangxi entries, IDS decomposition, radical/strokes, wǔxíng, frequency</li>
          </ul>
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

import { useEffect, useState } from "react";
import {
  distinctStrokes,
  filterCharacters,
  getBlocks,
  getWuxingRows,
  type FilterCriteria,
} from "../db/queries";
import type { BlockRow, CharacterRow, WuxingRow } from "../db/types";
import { CharGrid } from "../components/CharGrid";
import { makeCoverageChecker } from "../lib/fontCoverage";
import { useI18n } from "../i18n";

interface Props {
  onOpenChar: (char: string) => void;
}

const DEFAULT_FONT = "sans-serif";

export function FilterView({ onOpenChar }: Props) {
  const { t, lang } = useI18n();
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [wuxing, setWuxing] = useState<WuxingRow[]>([]);
  const [strokes, setStrokes] = useState<number[]>([]);

  const [crit, setCrit] = useState<FilterCriteria>({});
  const [results, setResults] = useState<CharacterRow[] | null>(null);
  const [busy, setBusy] = useState(false);

  const [font, setFont] = useState(DEFAULT_FONT);
  const [highlight, setHighlight] = useState(false);
  const [onlySupported, setOnlySupported] = useState(false);
  const [sep, setSep] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getBlocks().then(setBlocks);
    getWuxingRows().then(setWuxing);
    distinctStrokes().then(setStrokes);
  }, []);

  async function run() {
    setBusy(true);
    setResults(await filterCharacters({ ...crit, limit: 5000 }));
    setBusy(false);
  }

  function clearAll() {
    setCrit({});
    setResults(null);
  }

  function exportText(): string {
    if (!results) return "";
    let list = results.map((r) => r.char);
    if (onlySupported) {
      const checker = makeCoverageChecker(font);
      list = list.filter((c) => checker(c));
    }
    return list.join(sep);
  }

  async function copyOut() {
    await navigator.clipboard.writeText(exportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadOut() {
    const blob = new Blob([exportText()], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chct-charset.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const num = (v: string): number | null => (v === "" ? null : Number(v));

  return (
    <div className="filter-grid">
      <div className="panel card">
        <div className="filter-row">
          <label>{t("filter_radical")}</label>
          <input
            type="number"
            min={1}
            max={214}
            value={crit.radical ?? ""}
            onChange={(e) => setCrit({ ...crit, radical: num(e.target.value) })}
            placeholder="1–214"
          />
        </div>
        <div className="filter-row">
          <label>{t("filter_strokes")}</label>
          <select value={crit.strokes ?? ""} onChange={(e) => setCrit({ ...crit, strokes: num(e.target.value) })}>
            <option value="">—</option>
            {strokes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <label>{t("filter_wuxing")}</label>
          <select value={crit.wuxing ?? ""} onChange={(e) => setCrit({ ...crit, wuxing: num(e.target.value) })}>
            <option value="">—</option>
            {wuxing.map((w) => (
              <option key={w.id} value={w.id}>{lang === "zh" ? w.name_zh : w.name_en}</option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <label>{t("filter_block")}</label>
          <select value={crit.block ?? ""} onChange={(e) => setCrit({ ...crit, block: num(e.target.value) })}>
            <option value="">—</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>{lang === "zh" ? b.name_zh : b.name_en}</option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <label>{t("filter_component")}</label>
          <input
            value={crit.component ?? ""}
            maxLength={8}
            onChange={(e) => setCrit({ ...crit, component: e.target.value || null })}
            placeholder="如 心、氵、&CDP-...;"
          />
        </div>
        <div className="filter-row">
          <label>{t("filter_freq")}</label>
          <input
            type="number"
            value={crit.freqMin ?? ""}
            onChange={(e) => setCrit({ ...crit, freqMin: num(e.target.value) })}
            placeholder="0–13"
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn" onClick={run} disabled={busy}>{t("filter_run")}</button>
          <button className="btn secondary" onClick={clearAll}>{t("filter_clear")}</button>
        </div>
      </div>

      <div>
        {busy && <div className="center"><div className="spinner" /></div>}
        {results && !busy && (
          <>
            <div className="toolbar">
              <span className="count">
                {results.length.toLocaleString()} {t("result_count")}
                {results.length >= 5000 && " (max 5000)"}
              </span>
              <label style={{ marginLeft: "auto" }}>
                {t("font_family")}:{" "}
                <input
                  value={font === DEFAULT_FONT ? "" : font}
                  placeholder="sans-serif"
                  onChange={(e) => setFont(e.target.value || DEFAULT_FONT)}
                  style={{ width: 130 }}
                />
              </label>
              <label>
                <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} />{" "}
                {lang === "zh" ? "字型支援高亮" : "highlight supported"}
              </label>
            </div>

            <CharGrid
              chars={results}
              fontFamily={font}
              highlightSupported={highlight}
              onSelect={(c) => onOpenChar(c.char)}
            />

            <div className="toolbar" style={{ marginTop: 12 }}>
              <label>
                {t("export_sep")}:{" "}
                <input value={sep} onChange={(e) => setSep(e.target.value)} style={{ width: 60 }} placeholder="（無）" />
              </label>
              <label>
                <input type="checkbox" checked={onlySupported} onChange={(e) => setOnlySupported(e.target.checked)} />{" "}
                {t("export_only_supported")}
              </label>
              <button className="btn secondary" onClick={copyOut}>{copied ? t("copied") : t("copy")}</button>
              <button className="btn secondary" onClick={downloadOut}>{t("download")}</button>
            </div>
            <textarea className="output" readOnly value={exportText()} />
          </>
        )}
        {!results && !busy && (
          <div className="center muted">{lang === "zh" ? "設定條件後按「查詢」。" : "Set criteria and press Run."}</div>
        )}
      </div>
    </div>
  );
}

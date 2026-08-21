import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  distinctStrokes,
  filterCharacters,
  getBlocks,
  getComponents,
  getRadicals,
  getWuxingRows,
  type FilterCriteria,
} from "../db/queries";
import type { BlockRow, CharacterRow, ComponentRow, WuxingRow } from "../db/types";
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
  const [radicals, setRadicals] = useState<ComponentRow[]>([]);
  const [components, setComponents] = useState<ComponentRow[]>([]);
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
  const runSeq = useRef(0);

  useEffect(() => {
    getBlocks().then(setBlocks);
    getRadicals().then(setRadicals);
    getComponents().then(setComponents);
    getWuxingRows().then(setWuxing);
    distinctStrokes().then(setStrokes);
  }, []);

  useEffect(() => {
    const seq = ++runSeq.current;
    setBusy(true);
    const timer = window.setTimeout(async () => {
      try {
        const rows = await filterCharacters({ ...crit, limit: 5000 });
        if (seq === runSeq.current) setResults(rows);
      } catch (e) {
        console.error(e);
        if (seq === runSeq.current) setResults([]);
      } finally {
        if (seq === runSeq.current) setBusy(false);
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [crit]);

  function clearAll() {
    runSeq.current += 1;
    setCrit({});
    setResults(null);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* ignore */
    }
  }

  function toggleRadical(id: number) {
    setCrit((prev) => ({ ...prev, radical: prev.radical === id ? null : id }));
  }

  function toggleComponent(comp: string) {
    setCrit((prev) => {
      const selected = new Set(prev.components ?? []);
      if (selected.has(comp)) {
        selected.delete(comp);
      } else {
        selected.add(comp);
      }
      return { ...prev, component: null, components: Array.from(selected) };
    });
  }

  const exportChars = useMemo(() => {
    if (!results) return [];
    let list = results.map((r) => r.char);
    if (onlySupported) {
      const checker = makeCoverageChecker(font);
      list = list.filter((c) => checker(c));
    }
    return list;
  }, [font, onlySupported, results]);

  const exportText = useMemo(() => exportChars.join(sep), [exportChars, sep]);

  async function copyOut() {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadOut() {
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "hanglyph-charset.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const num = (v: string): number | null => {
    if (v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const selectedComponents = crit.components ?? [];

  return (
    <div className="filter-grid">
      <div className="panel card">
        <ToggleGroup
          title={t("filter_radical")}
          count={radicals.length}
          className="radical-toggle-list"
        >
          {radicals.map((r) => (
            <button
              key={r.id}
              type="button"
              data-radical-id={r.id}
              className={`toggle-chip radical-chip${crit.radical === r.id ? " active" : ""}`}
              title={`№${r.id}${r.stroke != null ? ` · ${r.stroke} strokes` : ""}`}
              onClick={() => toggleRadical(r.id)}
            >
              <span className="glyph-mini">{r.comp}</span>
              <span className="meta-mini">{r.id}</span>
            </button>
          ))}
        </ToggleGroup>

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
          <ToggleGroup
            title={t("filter_component")}
            count={components.length}
            className="component-toggle-list"
          >
            {components.map((c) => (
              <button
                key={`${c.id}-${c.comp}`}
                type="button"
                data-component={c.comp}
                className={`toggle-chip component-chip${(crit.components ?? []).includes(c.comp) ? " active" : ""}`}
                title={`${c.comp}${c.stroke != null ? ` · ${c.stroke} strokes` : ""}`}
                onClick={() => toggleComponent(c.comp)}
              >
                <span className="glyph-mini">{c.comp}</span>
                {c.stroke != null && <span className="meta-mini">{c.stroke}</span>}
              </button>
            ))}
          </ToggleGroup>
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
                {selectedComponents.length > 1 && ` · ${selectedComponents.join(" + ")}`}
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
            <textarea className="output" readOnly value={exportText} />
          </>
        )}
        {!results && !busy && <div className="center muted">{t("filter_auto_waiting")}</div>}
      </div>
    </div>
  );
}

function ToggleGroup({
  title,
  count,
  className,
  children,
}: {
  title: string;
  count: number;
  className: string;
  children: ReactNode;
}) {
  return (
    <div className="filter-row toggle-section">
      <div className="toggle-heading">
        <label>{title}</label>
        <span>{count.toLocaleString()}</span>
      </div>
      <div className={`toggle-list ${className}`}>{children}</div>
    </div>
  );
}

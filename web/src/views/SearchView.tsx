import { useRef, useState } from "react";
import { fullTextSearch, type FtsHit } from "../db/queries";
import { useI18n } from "../i18n";

interface Props {
  onOpenChar: (char: string) => void;
}

// 將 FTS snippet 的 [ ] 標記轉為 <mark>。
function renderSnippet(s: string) {
  const parts = s.split(/(\[[^\]]*\])/g);
  return parts.map((p, i) =>
    p.startsWith("[") && p.endsWith("]") ? <mark key={i}>{p.slice(1, -1)}</mark> : <span key={i}>{p}</span>,
  );
}

export function SearchView({ onOpenChar }: Props) {
  const { t } = useI18n();
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<FtsHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const requestSeq = useRef(0);

  async function run() {
    if (!term.trim()) return;
    const seq = ++requestSeq.current;
    setBusy(true);
    try {
      const rows = await fullTextSearch(term);
      if (seq === requestSeq.current) setHits(rows);
    } catch (e) {
      console.error(e);
      if (seq === requestSeq.current) setHits([]);
    } finally {
      if (seq === requestSeq.current) setBusy(false);
    }
  }

  return (
    <div>
      <form
        className="searchbar"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t("fts_placeholder")} autoFocus />
        <button className="btn" type="submit">{t("search_btn")}</button>
      </form>

      {busy && <div className="center"><div className="spinner" /></div>}
      {hits && !busy && (
        <div className="panel">
          {hits.length === 0 && <div className="center muted">{t("not_found")}</div>}
          {hits.map((h) => (
            <div className="hit" key={h.id}>
              <div className="h-char" onClick={() => onOpenChar(h.char)} title={h.codepoint_hex}>
                {h.char}
              </div>
              <div className="h-snip">{renderSnippet(h.snippet)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

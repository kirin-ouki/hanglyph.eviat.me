import { useEffect, useState } from "react";
import { getBlocks, getReadings } from "../db/queries";
import type { BlockRow, CharacterRow } from "../db/types";
import { decompose, type IdsNode } from "../lib/ids";
import { WUXING } from "../lib/constants";
import { useI18n } from "../i18n";
import { RomanizationPanel } from "./RomanizationPanel";
import { DecompositionTree } from "./DecompositionTree";

interface Props {
  char: CharacterRow;
  onNavigate: (charOrInput: string) => void;
}

export function CharDetail({ char, onNavigate }: Props) {
  const { t, lang } = useI18n();
  const [readings, setReadings] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [tree, setTree] = useState<IdsNode | null>(null);

  useEffect(() => {
    getBlocks().then(setBlocks);
  }, []);

  useEffect(() => {
    let alive = true;
    getReadings(char.id).then((rs) => alive && setReadings(rs.map((r) => r.bopomofo)));
    setTree(null);
    decompose(char.char).then((tr) => alive && setTree(tr));
    return () => {
      alive = false;
    };
  }, [char.id]);

  const blockName = (id: number | null) => {
    const b = blocks.find((x) => x.id === id);
    return b ? (lang === "zh" ? b.name_zh : b.name_en) : "—";
  };
  const wx = char.wuxing != null ? WUXING[char.wuxing] : null;

  return (
    <div className="panel card">
      <div className="detail">
        <div className="glyphbox">
          <div className="glyph">{char.char}</div>
          <div className="glyph-cp">{char.codepoint_hex} · {char.codepoint}</div>
        </div>

        <div>
          <div className="facts">
            <Fact k={t("field_block")} v={blockName(char.block)} />
            <Fact k={t("field_radical")} v={char.radical_no != null ? `№${char.radical_no}` : "—"} />
            <Fact k={t("field_strokes")} v={char.stroke_total != null ? String(char.stroke_total) : "—"} />
            <Fact
              k={t("field_wuxing")}
              v={wx ? <span className="badge" style={{ background: wx.color }}>{lang === "zh" ? wx.zh : wx.en}</span> : "—"}
            />
            <Fact k={t("field_freq")} v={char.freq_all != null ? String(char.freq_all) : "—"} />
            <Fact k={t("field_ids")} v={char.ids ?? "—"} />
          </div>

          {readings.length > 0 && (
            <div className="section">
              <h3>{t("field_readings")}</h3>
              {readings.map((r, i) => (
                <span className="reading-chip" key={i}>{r}</span>
              ))}
            </div>
          )}

          {readings.length > 0 && (
            <div className="section">
              <h3>{t("field_romanization")}</h3>
              <RomanizationPanel readings={readings} />
            </div>
          )}
        </div>
      </div>

      {tree && tree.children.length > 0 && (
        <div className="section">
          <h3>{t("field_decomp")}</h3>
          <DecompositionTree node={tree} onSelect={onNavigate} />
        </div>
      )}

      {char.kangxi_loc && (
        <div className="section">
          <h3>{t("field_kangxi_loc")}</h3>
          <div>{char.kangxi_loc}</div>
        </div>
      )}

      {char.kangxi_text && (
        <div className="section">
          <h3>{t("field_kangxi_text")}</h3>
          <div className="kangxi">{char.kangxi_text}</div>
        </div>
      )}
    </div>
  );
}

function Fact({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="fact">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

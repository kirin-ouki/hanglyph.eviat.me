import { useState } from "react";
import { romanize } from "../db/queries";
import type { RomanizationRow } from "../db/types";
import { ROM_SYSTEMS, splitTone, TONE_NUMBER } from "../lib/constants";
import { useI18n } from "../i18n";

export function ConvertView() {
  const { t, lang } = useI18n();
  const [input, setInput] = useState("");
  const [out, setOut] = useState<{ reading: string; row: RomanizationRow | null }[]>([]);

  async function run() {
    const lines = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const rows = await Promise.all(
      lines.map(async (reading) => ({ reading, row: await romanize(splitTone(reading).base) })),
    );
    setOut(rows);
  }

  const value = (reading: string, row: RomanizationRow | null, col: keyof RomanizationRow) => {
    const v = row?.[col];
    if (!v) return "—";
    const { tone } = splitTone(reading);
    const toneNum = col === "ipa" ? "" : tone ? TONE_NUMBER[tone] ?? "" : "1";
    return v + toneNum;
  };

  return (
    <div className="convert-grid">
      <div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("convert_input") + "\n\nㄞˋ\nㄕㄨㄟˇ\nㄓㄨㄥ"}
        />
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={run}>{t("nav_convert")}</button>
        </div>
      </div>
      <div className="panel card">
        {out.length === 0 && <div className="muted">{lang === "zh" ? "輸出將顯示於此。" : "Output appears here."}</div>}
        {out.map((o, i) => (
          <div key={i} className="section" style={{ marginTop: i ? 16 : 0 }}>
            <h3>
              <span className="reading-chip">{o.reading}</span>
            </h3>
            <table className="rom-table">
              <tbody>
                {ROM_SYSTEMS.map((s) => (
                  <tr key={s.col}>
                    <td className="sys">{lang === "zh" ? s.zh : s.en}</td>
                    <td className="val">{value(o.reading, o.row, s.col)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { romanize } from "../db/queries";
import type { RomanizationRow } from "../db/types";
import { ROM_SYSTEMS, splitTone, TONE_NUMBER } from "../lib/constants";
import { useI18n } from "../i18n";

interface Props {
  readings: string[]; // 注音（含聲調）
}

export function RomanizationPanel({ readings }: Props) {
  const { lang } = useI18n();
  const [rows, setRows] = useState<Record<string, RomanizationRow | null>>({});

  useEffect(() => {
    let alive = true;
    const bases = Array.from(new Set(readings.map((r) => splitTone(r).base)));
    Promise.all(bases.map((b) => romanize(b).then((row) => [b, row] as const))).then((pairs) => {
      if (alive) setRows(Object.fromEntries(pairs));
    });
    return () => {
      alive = false;
    };
  }, [readings.join("|")]);

  if (readings.length === 0) return null;

  const cell = (reading: string, col: keyof RomanizationRow): string => {
    const { base, tone } = splitTone(reading);
    const row = rows[base];
    const val = row?.[col];
    if (!val) return "—";
    const toneNum = col === "ipa" ? "" : tone ? TONE_NUMBER[tone] ?? "" : "1";
    return val + toneNum;
  };

  return (
    <table className="rom-table">
      <tbody>
        {ROM_SYSTEMS.map((s) => (
          <tr key={s.col}>
            <td className="sys">{lang === "zh" ? s.zh : s.en}</td>
            {readings.map((r, i) => (
              <td className="val" key={i}>
                {cell(r, s.col)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

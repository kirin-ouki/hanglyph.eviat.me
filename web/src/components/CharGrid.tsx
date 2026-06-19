import { useEffect, useMemo, useRef, useState } from "react";
import type { CharacterRow } from "../db/types";
import { makeCoverageChecker } from "../lib/fontCoverage";

interface Props {
  chars: CharacterRow[];
  fontFamily: string;
  highlightSupported: boolean;
  onSelect: (char: CharacterRow) => void;
}

const ROW_H = 52; // 與 .cell 尺寸對齊（含 gap）
const OVERSCAN = 6;

// 輕量虛擬化：只渲染可視範圍內的列，支撐數千字不卡。
export function CharGrid({ chars, fontFamily, highlightSupported, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(12);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(480);

  const checker = useMemo(() => makeCoverageChecker(fontFamily), [fontFamily]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setCols(Math.max(1, Math.floor((w + 6) / 52)));
      setViewH(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = Math.ceil(chars.length / cols);
  const totalH = rows * ROW_H;
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const endRow = Math.min(rows, Math.ceil((scrollTop + viewH) / ROW_H) + OVERSCAN);
  const visible = chars.slice(startRow * cols, endRow * cols);

  return (
    <div
      ref={ref}
      className="panel"
      style={{ height: 540, overflow: "auto", padding: 8 }}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
    >
      <div style={{ height: totalH, position: "relative" }}>
        <div
          className="chargrid"
          style={{
            position: "absolute",
            top: startRow * ROW_H,
            left: 0,
            right: 0,
            gridTemplateColumns: `repeat(${cols}, minmax(46px, 1fr))`,
          }}
        >
          {visible.map((c) => {
            const supported = highlightSupported && checker(c.char);
            return (
              <div
                key={c.id}
                className={`cell${supported ? " supported" : ""}`}
                style={{ fontFamily: `"${fontFamily}", sans-serif` }}
                title={`${c.char} ${c.codepoint_hex}`}
                onClick={() => onSelect(c)}
              >
                {c.char}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

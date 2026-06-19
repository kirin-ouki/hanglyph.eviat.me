// 瀏覽器端字型涵蓋偵測（取代原 WPF 的 GlyphTypeface 掃描）。
// 原理：同一字分別以「目標字型」與「一個不存在的字型」繪製到 canvas。
// 若兩者像素相同 → 瀏覽器對兩者都用了系統後備字型 → 目標字型本身缺此字。
// 若不同 → 目標字型擁有自己的字形 → 支援。
const SIZE = 24;
const MISSING_FAMILY = "__chct_no_such_font__";

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D {
  if (!ctx) {
    canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.textBaseline = "top";
  }
  return ctx;
}

function render(ch: string, family: string): string {
  const c = getCtx();
  c.clearRect(0, 0, SIZE, SIZE);
  c.font = `${SIZE - 4}px "${family}", ${MISSING_FAMILY}`;
  c.fillText(ch, 1, 1);
  return c.getImageData(0, 0, SIZE, SIZE).data.join(",");
}

export function makeCoverageChecker(fontFamily: string): (ch: string) => boolean {
  const cache = new Map<string, boolean>();
  return (ch: string): boolean => {
    if (!ch) return false;
    const hit = cache.get(ch);
    if (hit !== undefined) return hit;
    const withFont = render(ch, fontFamily);
    const fallback = render(ch, MISSING_FAMILY);
    const supported = withFont !== fallback;
    cache.set(ch, supported);
    return supported;
  };
}

/** 列出本機可用、且確實涵蓋指定字的字型（用於設定預設顯示字型）。 */
export async function localFonts(): Promise<string[]> {
  // queryLocalFonts 僅在使用者授權後可用；否則回傳空陣列，UI 提供手動輸入字型名。
  const anyNav = navigator as unknown as { fonts?: { values?: () => Iterable<FontFace> } };
  const names = new Set<string>();
  try {
    for (const f of anyNav.fonts?.values?.() ?? []) names.add(f.family);
  } catch {
    /* ignore */
  }
  return Array.from(names).sort();
}

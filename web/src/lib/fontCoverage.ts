// 瀏覽器端字型涵蓋偵測（取代原 WPF 的 GlyphTypeface 掃描）。
// 原理：同一字分別以「目標字型」與「一個不存在的字型」繪製到 canvas。
// 若兩者像素相同 → 瀏覽器對兩者都用了系統後備字型 → 目標字型本身缺此字。
// 若不同 → 目標字型擁有自己的字形 → 支援。
import { cssFontFamilyName } from "./fonts";

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

function fallbackGenericFor(family: string): string {
  return family.trim().toLowerCase() === "serif" ? "sans-serif" : "serif";
}

function render(ch: string, family: string, fallbackGeneric: string): Uint8ClampedArray {
  const c = getCtx();
  c.clearRect(0, 0, SIZE, SIZE);
  c.font = `${SIZE - 4}px ${cssFontFamilyName(family)}, ${fallbackGeneric}`;
  c.fillText(ch, 1, 1);
  return c.getImageData(0, 0, SIZE, SIZE).data;
}

function samePixels(a: Uint8ClampedArray, b: Uint8ClampedArray): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function makeCoverageChecker(fontFamily: string): (ch: string) => boolean {
  const fallbackGeneric = fallbackGenericFor(fontFamily);
  const cache = new Map<string, boolean>();
  return (ch: string): boolean => {
    if (!ch) return false;
    const hit = cache.get(ch);
    if (hit !== undefined) return hit;
    const withFont = render(ch, fontFamily, fallbackGeneric);
    const fallback = render(ch, MISSING_FAMILY, fallbackGeneric);
    const supported = !samePixels(withFont, fallback);
    cache.set(ch, supported);
    return supported;
  };
}

/** 列出本機可用、且確實涵蓋指定字的字型（用於設定預設顯示字型）。 */
export async function localFonts(): Promise<string[]> {
  // queryLocalFonts 僅在使用者授權後可用；否則回傳空陣列，UI 提供手動輸入字型名。
  const names = new Set<string>();
  if (typeof window === "undefined") return [];
  try {
    const anyWindow = window as unknown as { queryLocalFonts?: () => Promise<Array<{ family: string }>> };
    for (const f of (await anyWindow.queryLocalFonts?.()) ?? []) names.add(f.family);
  } catch {
    /* ignore */
  }
  return Array.from(names).sort();
}

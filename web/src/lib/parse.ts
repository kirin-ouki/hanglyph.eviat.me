// 純函式：解析查詢輸入。單一漢字 / U+XXXX / 十進位碼位。
export interface LookupInput {
  codepoint?: number;
  char?: string;
}

export function parseLookupInput(raw: string): LookupInput {
  const s = raw.trim();
  if (!s) return {};
  const mHex = s.match(/^u\+?([0-9a-f]{4,6})$/i);
  if (mHex) return { codepoint: parseInt(mHex[1], 16) };
  if (/^\d+$/.test(s)) return { codepoint: parseInt(s, 10) };
  const cp = s.codePointAt(0)!;
  return { char: String.fromCodePoint(cp), codepoint: cp };
}

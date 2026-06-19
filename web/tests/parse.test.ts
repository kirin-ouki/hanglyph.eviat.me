import { describe, it, expect } from "vitest";
import { parseLookupInput } from "../src/lib/parse";

describe("parseLookupInput", () => {
  it("單一漢字 → char + codepoint", () => {
    expect(parseLookupInput("愛")).toEqual({ char: "愛", codepoint: 24859 });
  });
  it("U+XXXX（大小寫、有無加號）", () => {
    expect(parseLookupInput("U+611B")).toEqual({ codepoint: 0x611b });
    expect(parseLookupInput("u611b")).toEqual({ codepoint: 0x611b });
    expect(parseLookupInput("U+20000")).toEqual({ codepoint: 0x20000 });
  });
  it("十進位碼位", () => {
    expect(parseLookupInput("24859")).toEqual({ codepoint: 24859 });
  });
  it("空字串 → 空物件", () => {
    expect(parseLookupInput("  ")).toEqual({});
  });
  it("supplementary plane 字以 codePointAt 取得正確碼位", () => {
    expect(parseLookupInput("\u{20000}")).toEqual({ char: "\u{20000}", codepoint: 0x20000 });
  });
});

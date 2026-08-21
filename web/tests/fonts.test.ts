import { describe, expect, it } from "vitest";
import { cssFontFamilyName } from "../src/lib/fonts";

describe("cssFontFamilyName", () => {
  it("generic font family 不加引號", () => {
    expect(cssFontFamilyName("sans-serif")).toBe("sans-serif");
    expect(cssFontFamilyName("system-ui")).toBe("system-ui");
  });

  it("一般字型名稱加引號並跳脫", () => {
    expect(cssFontFamilyName("Microsoft JhengHei")).toBe('"Microsoft JhengHei"');
    expect(cssFontFamilyName('A "Quoted" Font')).toBe('"A \\"Quoted\\" Font"');
  });

  it("空白名稱回到 sans-serif", () => {
    expect(cssFontFamilyName("  ")).toBe("sans-serif");
  });
});

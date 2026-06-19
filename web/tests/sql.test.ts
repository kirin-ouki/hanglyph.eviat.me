import { describe, it, expect } from "vitest";
import { escapeLiteral, inlineParams } from "../src/db/sql";

// 這是參數綁定失效後的安全網——務必嚴格驗證跳脫，避免破壞查詢或誤判。
describe("escapeLiteral", () => {
  it("整數直接寫入", () => {
    expect(escapeLiteral(24859)).toBe("24859");
    expect(escapeLiteral(0)).toBe("0");
    expect(escapeLiteral(-1)).toBe("-1");
  });
  it("null → NULL", () => {
    expect(escapeLiteral(null)).toBe("NULL");
  });
  it("字串以單引號包裹", () => {
    expect(escapeLiteral("愛")).toBe("'愛'");
  });
  it("單引號以重複跳脫（防注入/防破壞查詢）", () => {
    expect(escapeLiteral("a'b")).toBe("'a''b'");
    expect(escapeLiteral("'; DROP TABLE x; --")).toBe("'''; DROP TABLE x; --'");
  });
  it("拒絕非有限數值", () => {
    expect(() => escapeLiteral(NaN)).toThrow();
    expect(() => escapeLiteral(Infinity)).toThrow();
  });
});

describe("inlineParams", () => {
  it("依序替換 ? 佔位符", () => {
    expect(inlineParams("WHERE a = ? AND b = ?", [1, "x"])).toBe("WHERE a = 1 AND b = 'x'");
  });
  it("支援 codepoint 查詢", () => {
    expect(inlineParams("WHERE codepoint = ?", [24859])).toBe("WHERE codepoint = 24859");
  });
  it("無參數時原樣返回", () => {
    expect(inlineParams("SELECT 1", [])).toBe("SELECT 1");
  });
  it("參數數量不符時拋錯", () => {
    expect(() => inlineParams("a = ?", [])).toThrow();
    expect(() => inlineParams("a = ?", [1, 2])).toThrow();
  });
});

import { describe, it, expect } from "vitest";
import { parseComponents, isIdsOperator, isEntity } from "../src/lib/ids";

describe("isIdsOperator", () => {
  it("辨識 IDS 結構運算子 (U+2FF0–2FFF)", () => {
    expect(isIdsOperator("⿱")).toBe(true);
    expect(isIdsOperator("⿰")).toBe(true);
    expect(isIdsOperator("字")).toBe(false);
    expect(isIdsOperator("心")).toBe(false);
  });
});

describe("isEntity", () => {
  it("辨識 &CDP-...; 實體參照", () => {
    expect(isEntity("&CDP-8BB8;")).toBe(true);
    expect(isEntity("心")).toBe(false);
  });
});

describe("parseComponents", () => {
  it("拆出直接部件，去除結構運算子", () => {
    expect(parseComponents("⿱宀子", "字")).toEqual(["宀", "子"]);
  });
  it("&entity; 視為單一部件", () => {
    expect(parseComponents("⿳&CDP-8BB8;心夂", "愛")).toEqual(["&CDP-8BB8;", "心", "夂"]);
  });
  it("原子字（拆分等於自身）回傳空", () => {
    expect(parseComponents("永", "永")).toEqual([]);
  });
  it("去重複部件", () => {
    expect(parseComponents("⿰龍龍", "龖")).toEqual(["龍"]);
  });
  it("null / 空字串回傳空陣列", () => {
    expect(parseComponents(null)).toEqual([]);
    expect(parseComponents("")).toEqual([]);
  });
  it("正確處理 BMP 外的部件字（supplementary plane）", () => {
    // ⿰ + 𠀀(U+20000) + 心
    const r = parseComponents("⿰\u{20000}心", "X");
    expect(r).toEqual(["\u{20000}", "心"]);
  });
});

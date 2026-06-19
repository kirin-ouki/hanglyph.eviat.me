import { describe, it, expect } from "vitest";
import { splitTone, TONE_NUMBER } from "../src/lib/constants";

describe("splitTone", () => {
  it("分離注音聲調符號", () => {
    expect(splitTone("ㄞˋ")).toEqual({ base: "ㄞ", tone: "ˋ" });
    expect(splitTone("ㄕㄨㄟˇ")).toEqual({ base: "ㄕㄨㄟ", tone: "ˇ" });
    expect(splitTone("ㄇㄚ˙")).toEqual({ base: "ㄇㄚ", tone: "˙" });
  });
  it("第一聲（無調號）tone 為空", () => {
    expect(splitTone("ㄓㄨㄥ")).toEqual({ base: "ㄓㄨㄥ", tone: "" });
  });
});

describe("TONE_NUMBER", () => {
  it("調號對應數字", () => {
    expect(TONE_NUMBER["ˊ"]).toBe("2");
    expect(TONE_NUMBER["ˇ"]).toBe("3");
    expect(TONE_NUMBER["ˋ"]).toBe("4");
    expect(TONE_NUMBER["˙"]).toBe("5");
  });
});

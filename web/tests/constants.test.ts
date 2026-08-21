import { describe, expect, it } from "vitest";
import { splitTone } from "../src/lib/constants";

describe("splitTone", () => {
  it("無聲調（一聲）", () => {
    expect(splitTone("ㄓㄨㄥ")).toEqual({ base: "ㄓㄨㄥ", tone: "" });
  });

  it("尾綴聲調", () => {
    expect(splitTone("ㄞˋ")).toEqual({ base: "ㄞ", tone: "ˋ" });
    expect(splitTone("ㄕㄨㄟˇ")).toEqual({ base: "ㄕㄨㄟ", tone: "ˇ" });
  });

  it("輕聲尾綴（資料庫格式）", () => {
    expect(splitTone("ㄇㄚ˙")).toEqual({ base: "ㄇㄚ", tone: "˙" });
  });

  it("輕聲前綴（標準正字法）", () => {
    expect(splitTone("˙ㄇㄚ")).toEqual({ base: "ㄇㄚ", tone: "˙" });
  });
});

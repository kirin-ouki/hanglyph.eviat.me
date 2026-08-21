#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""製作自帶的思源黑體 / Noto Sans CJK「BMP CJK 子集」woff2，供 BMP＋Ext A 一致顯示。

策略（見 web/PLANGOTHIC.md）：BMP（URO/Ext A/相容）以思源黑體（Noto Sans CJK）顯示，
Ext B–J 由 Plangothic 補。@font-face 以 src: local() 優先採用使用者已安裝的思源黑體／
Noto Sans CJK，未安裝者才下載本子集（約數 MB），確保跨裝置一致為黑體。

來源：Noto Sans CJK TC Regular（Google/Adobe，OFL-1.1）。
用法：python web/scripts/setup-noto.py
輸出：web/public/fonts/NotoSansCJKtc-cjkbmp.woff2
"""
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(HERE, "..", "..", "data", "sources")
OUT_DIR = os.path.join(HERE, "..", "public", "fonts")
SRC_OTF = os.path.join(SRC_DIR, "NotoSansCJKtc-Regular.otf")
OUT_WOFF2 = os.path.join(OUT_DIR, "NotoSansCJKtc-cjkbmp.woff2")
SRC_URL = ("https://github.com/notofonts/noto-cjk/raw/main/"
           "Sans/OTF/TraditionalChinese/NotoSansCJKtc-Regular.otf")

# BMP CJK 子集範圍（與 src/lib/fonts.ts 的 @font-face unicode-range 對齊）。
UNICODES = [
    (0x2E80, 0x2EFF),  # CJK 部首補充
    (0x2F00, 0x2FDF),  # 康熙部首
    (0x2FF0, 0x2FFF),  # 表意文字描述符（IDS 運算子）
    (0x3000, 0x303F),  # CJK 符號與標點（含〇）
    (0x3400, 0x4DBF),  # 擴展 A
    (0x4E00, 0x9FFF),  # 基本區 URO
    (0xF900, 0xFAFF),  # 相容表意文字
]


def main():
    os.makedirs(SRC_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    if not (os.path.exists(SRC_OTF) and os.path.getsize(SRC_OTF) > 0):
        print(f"[noto] 下載 {SRC_URL} …")
        urllib.request.urlretrieve(SRC_URL, SRC_OTF)
    print(f"[noto] 子集化 → {os.path.basename(OUT_WOFF2)} …")
    try:
        from fontTools import subset
    except ImportError:
        sys.exit("需要 fonttools 與 brotli：pip install fonttools brotli")
    unicodes = ",".join(f"U+{lo:04X}-{hi:04X}" for lo, hi in UNICODES)
    subset.main([
        SRC_OTF,
        f"--unicodes={unicodes}",
        "--layout-features=",   # 顯示用後備字型，不需 GSUB/GPOS，移除以縮小
        "--no-hinting",
        "--flavor=woff2",
        f"--output-file={OUT_WOFF2}",
    ])
    mb = os.path.getsize(OUT_WOFF2) / 1e6
    print(f"[noto] 完成：{OUT_WOFF2}（{mb:.1f} MB）")


if __name__ == "__main__":
    main()

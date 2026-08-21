# 一次性：實測 Plangothic P1/P2 各自的 cmap 覆蓋，決定 @font-face 的 unicode-range。
# 用法：python web/scripts/inspect-plangothic.py
from fontTools.ttLib import TTFont
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "public", "fonts")

SAMPLES = [
    ("URO   P0", 0x4E00), ("ExtA  P0", 0x3400), ("Compat P0", 0xF900),
    ("ExtB  P2", 0x20000), ("ExtC  P2", 0x2A700), ("ExtD  P2", 0x2B740),
    ("ExtE  P2", 0x2B820), ("ExtF  P2", 0x2CEB0), ("CmpSup P2", 0x2F800),
    ("ExtI  P2", 0x2EBF0), ("ExtG  P3", 0x30000), ("ExtH  P3", 0x31350),
    ("ExtJ  P3", 0x323B0),
]


def report(path):
    f = TTFont(path, lazy=True)
    cmap = f.getBestCmap()
    cps = sorted(cmap.keys())
    print(f"\n=== {os.path.basename(path)} ===")
    print(f"  字符數 {len(cps)} ; 範圍 U+{cps[0]:04X}–U+{cps[-1]:04X}")
    # 各平面分布
    planes = {}
    for cp in cps:
        planes[cp >> 16] = planes.get(cp >> 16, 0) + 1
    print("  平面分布:", {f"P{p}": n for p, n in sorted(planes.items())})
    for label, cp in SAMPLES:
        print(f"    {label}  U+{cp:05X}: {'✓' if cp in cmap else '·'}")
    f.close()


for name in ("PlangothicP1-Regular.ttf", "PlangothicP2-Regular.ttf"):
    p = os.path.join(FONTS, name)
    if os.path.exists(p):
        report(p)
    else:
        print(f"[缺] {name} 尚未下載")

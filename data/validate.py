#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""驗證 data/dist/char.sqlite 的完整性與資料量（供本機與 CI release 使用）。

用法：python data/validate.py [char.sqlite]
無資料庫時以非零結束碼結束，方便在管線中判斷。
"""
import os, sys, sqlite3

PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(__file__), "dist", "char.sqlite")

# (表名, 最小列數) — 守住遷移不致悄悄掉資料。
EXPECT = {
    "characters": 88000,
    "readings": 80000,
    "char_components": 150000,
    "romanization": 400,
    "components_standard": 500,
    "components_radical": 214,
    "blocks": 9,
}


def main() -> int:
    if not os.path.exists(PATH):
        print(f"[validate] 找不到 {PATH}；請先執行 python data/migrate.py", file=sys.stderr)
        return 2
    db = sqlite3.connect(PATH)
    ok = True

    if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
        print("[validate] FAIL integrity_check"); ok = False

    for table, minimum in EXPECT.items():
        try:
            n = db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        except sqlite3.OperationalError as e:
            print(f"[validate] FAIL {table}: {e}"); ok = False; continue
        mark = "ok " if n >= minimum else "FAIL"
        if n < minimum:
            ok = False
        print(f"[validate] {mark} {table:24s} {n:>8d} (>= {minimum})")

    # 抽樣：愛 必須可由 codepoint 查到且部件含「心」
    row = db.execute("SELECT id FROM characters WHERE codepoint = 24859").fetchone()
    if not row:
        print("[validate] FAIL 抽樣字「愛」查無"); ok = False
    else:
        comps = [r[0] for r in db.execute(
            "SELECT component FROM char_components WHERE char_id = ?", (row[0],))]
        if "心" not in comps:
            print("[validate] FAIL 「愛」部件未含「心」"); ok = False

    db.close()
    print("[validate]", "PASS" if ok else "FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""補充收錄擴展區 G/H/I/J 漢字到既有 char.sqlite（不重建，直接增列）。

來源：Unicode 17.0 Unihan（kRSUnicode 部首/部首外筆畫、kTotalStrokes 總筆畫、
kMandarin 讀音）。讀音以本專案 romanization 表的 hanyu_pinyin 欄做「拼音→注音」
反查（保證與既有資料一致），缺者留 NULL。IDS 部件拆分為後續工作，暫留 NULL。

用法：
    python data/ingest_ext.py            # 預設 G H I J
    python data/ingest_ext.py G          # 只做 G（先驗證）
    python data/ingest_ext.py G H        # 做 G、H

可重複執行：每個區塊會先刪除既有列再重插（idempotent）。
執行後請跑 `cd web && npm run setup-data` 把 dist 複製到 public/data。
詳見 data/CATCHUP.md。
"""
import os
import sys
import json
import zipfile
import sqlite3
import datetime
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
SQLITE_PATH = os.path.join(HERE, "dist", "char.sqlite")
STATS_PATH = os.path.join(HERE, "dist", "stats.json")
UNIHAN_ZIP = os.path.join(HERE, "sources", "Unihan.zip")
CHISE_DIR = os.path.join(HERE, "sources", "chise-ids")
CHISE_BASE = "https://raw.githubusercontent.com/chise/ids/master"

# IDS 表意文字描述運算子（結構符號，非部件）。
IDS_OP_LO, IDS_OP_HI = 0x2FF0, 0x2FFF

# 區塊代號 → (blocks.id, 起, 訖, name_en, name_zh)。id 7–10 尚未使用（11/12 為相容區）。
EXT_BLOCKS = {
    "G": (7,  0x30000, 0x3134F, "CJK Unified Ideographs Extension G", "中日韓統一表意文字擴展G區"),
    "H": (8,  0x31350, 0x323AF, "CJK Unified Ideographs Extension H", "中日韓統一表意文字擴展H區"),
    "I": (9,  0x2EBF0, 0x2EE5F, "CJK Unified Ideographs Extension I", "中日韓統一表意文字擴展I區"),
    "J": (10, 0x323B0, 0x33479, "CJK Unified Ideographs Extension J", "中日韓統一表意文字擴展J區"),
}

# 拼音聲調（結合附加符號）→ 聲調號；輸出注音聲調符號（第一聲不標）。
TONE_COMB = {"̄": 1, "́": 2, "̌": 3, "̀": 4}
TONE_OUT = {1: "", 2: "ˊ", 3: "ˇ", 4: "ˋ", 5: "˙"}


def strip_tone(syllable):
    """漢語拼音（帶調號）→ (無調拼音, 聲調)。無調號者視為輕聲(5)。"""
    nfd = unicodedata.normalize("NFD", syllable)
    tone, out = 5, []
    for ch in nfd:
        if ch in TONE_COMB:
            tone = TONE_COMB[ch]
        else:
            out.append(ch)
    return unicodedata.normalize("NFC", "".join(out)), tone


def parse_radical(krs):
    """kRSUnicode 值（如 '120.6'、"182'.0"、空白分隔多值）→ 部首號（int）。"""
    if not krs:
        return None
    first = krs.split()[0]
    rad = first.split(".")[0].replace("'", "")
    try:
        return int(rad)
    except ValueError:
        return None


def parse_strokes(kts):
    """kTotalStrokes 值（如 '10' 或 '10 11'）→ 第一個整數。"""
    if not kts:
        return None
    try:
        return int(kts.split()[0])
    except ValueError:
        return None


def parse_components(ids, self_char):
    """從 IDS 拆分字串解析出直接部件 token（去 IDS 運算子，&entity; 視為單一部件，去自身）。
    與 migrate.py 的同名函式邏輯一致，確保「含部件」反查在新舊資料間相容。"""
    import re
    if not ids:
        return []
    tokens, seen = [], set()
    for part in re.split(r"(&[^;\s]+;)", ids):
        if not part:
            continue
        if part.startswith("&") and part.endswith(";"):
            cand = [part]
        else:
            cand = []
            for ch in part:
                cp = ord(ch)
                if IDS_OP_LO <= cp <= IDS_OP_HI:      # 結構運算子
                    continue
                if ch.isspace():
                    continue
                cand.append(ch)
        for t in cand:
            if t == self_char:                        # 原子字自身，跳過
                continue
            if t not in seen:
                seen.add(t)
                tokens.append(t)
    return tokens


def ensure_chise(letters):
    """確保 CHISE 各 Ext IDS 檔已下載到 data/sources/chise-ids/。"""
    os.makedirs(CHISE_DIR, exist_ok=True)
    for a in letters:
        dest = os.path.join(CHISE_DIR, f"IDS-UCS-Ext-{a}.txt")
        if os.path.exists(dest) and os.path.getsize(dest) > 0:
            continue
        url = f"{CHISE_BASE}/IDS-UCS-Ext-{a}.txt"
        print(f"      下載 {url} …")
        import urllib.request
        urllib.request.urlretrieve(url, dest)


def load_chise_ids(letters):
    """讀 CHISE IDS 檔，回傳 {cp: ids_string}（取第 3 欄主拆分）。"""
    ensure_chise(letters)
    ids_map = {}
    for a in letters:
        path = os.path.join(CHISE_DIR, f"IDS-UCS-Ext-{a}.txt")
        for ln in open(path, encoding="utf-8").read().splitlines():
            if not ln or ln.startswith(";"):
                continue
            cols = ln.split("\t")
            if len(cols) < 3 or not cols[0].startswith("U+"):
                continue
            try:
                cp = int(cols[0][2:], 16)
            except ValueError:
                continue
            ids = cols[2].strip()
            # 跳過「拆分等於自身」的無資訊列（單一字、與該字相同）。
            if ids and ids != cols[1]:
                ids_map[cp] = ids
    return ids_map


def load_unihan(targets):
    """讀 Unihan，回傳 {cp: {'rad':int|None,'str':int|None,'py':[拼音…]}}，僅含 targets 範圍。"""
    if not os.path.exists(UNIHAN_ZIP):
        sys.exit(f"找不到 {UNIHAN_ZIP}\n  請先下載："
                 f"https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip 置於 data/sources/")
    lo = min(s for _, s, _, _, _ in targets.values())
    hi = max(e for _, _, e, _, _ in targets.values())
    data = {}
    z = zipfile.ZipFile(UNIHAN_ZIP)
    for fname in ("Unihan_IRGSources.txt", "Unihan_Readings.txt"):
        for ln in z.read(fname).decode("utf-8").splitlines():
            if not ln or ln[0] == "#":
                continue
            cp_s, field, val = ln.split("\t", 2)
            cp = int(cp_s[2:], 16)
            if cp < lo or cp > hi:
                continue
            d = data.setdefault(cp, {})
            if field == "kRSUnicode":
                d["rad"] = parse_radical(val)
                d["has_rs"] = True
            elif field == "kTotalStrokes":
                d["str"] = parse_strokes(val)
            elif field == "kMandarin":
                d["py"] = val.split()
    return data


def build_pinyin2bopo(db):
    """以 romanization 表建「無調拼音 → 注音基底」反查。"""
    m = {}
    for bopo, py in db.execute("SELECT bopomofo, hanyu_pinyin FROM romanization"):
        if py and py not in m:
            m[py] = bopo
    return m


def to_readings(pylist, p2b):
    """[拼音帶調…] → [注音(含調)…]，去重、保序；無法對應者略過。"""
    out = []
    for py in pylist or []:
        base_py, tone = strip_tone(py)
        bopo = p2b.get(base_py)
        if not bopo:
            continue
        r = bopo + TONE_OUT[tone]
        if r not in out:
            out.append(r)
    return out


def in_range(cp, blocks):
    for _, lo, hi, _, _ in blocks:
        if lo <= cp <= hi:
            return True
    return False


def recompute_stats(db):
    """重算 stats.json 中由 DB 衍生的數字（其餘鍵保留）。"""
    stats = {}
    if os.path.exists(STATS_PATH):
        with open(STATS_PATH, encoding="utf-8") as f:
            stats = json.load(f)
    g1 = lambda sql: db.execute(sql).fetchone()[0]
    stats["characters"] = g1("SELECT COUNT(*) FROM characters")
    stats["readings"] = g1("SELECT COUNT(*) FROM readings")
    stats["char_components"] = g1("SELECT COUNT(*) FROM char_components")
    stats["block_dist"] = {str(b): n for b, n in db.execute(
        "SELECT block, COUNT(*) FROM characters GROUP BY block ORDER BY block")}
    comp = stats.get("completeness", {})
    for k, col in (("stroke_total", "stroke_total"), ("radical_no", "radical_no"), ("ids", "ids")):
        comp[k] = g1(f"SELECT COUNT(*) FROM characters WHERE {col} IS NOT NULL")
    comp["has_reading"] = g1("SELECT COUNT(DISTINCT char_id) FROM readings")
    stats["completeness"] = comp
    with open(STATS_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)


def main():
    letters = [a.upper() for a in sys.argv[1:]] or ["G", "H", "I", "J"]
    for a in letters:
        if a not in EXT_BLOCKS:
            sys.exit(f"未知區塊：{a}（可用 {', '.join(EXT_BLOCKS)}）")
    targets = {a: EXT_BLOCKS[a] for a in letters}

    if not os.path.exists(SQLITE_PATH):
        sys.exit(f"找不到 {SQLITE_PATH}（請先 python data/migrate.py 產生基底 DB）")

    print(f"[1/5] 讀取 Unihan 與 CHISE IDS（{', '.join(letters)}）…")
    uni = load_unihan(targets)
    ids_map = load_chise_ids(letters)

    db = sqlite3.connect(SQLITE_PATH)
    db.execute("PRAGMA foreign_keys=OFF")
    p2b = build_pinyin2bopo(db)
    next_id = (db.execute("SELECT MAX(id) FROM characters").fetchone()[0] or 0) + 1

    total_added = total_readings = 0
    for letter, (bid, lo, hi, name_en, name_zh) in targets.items():
        # 區塊登錄
        db.execute("INSERT OR REPLACE INTO blocks(id,name_en,name_zh) VALUES (?,?,?)",
                   (bid, name_en, name_zh))
        # 既有列清除（idempotent）
        old_ids = [r[0] for r in db.execute("SELECT id FROM characters WHERE block=?", (bid,))]
        if old_ids:
            qs = ",".join("?" * len(old_ids))
            db.execute(f"DELETE FROM readings WHERE char_id IN ({qs})", old_ids)
            db.execute(f"DELETE FROM char_components WHERE char_id IN ({qs})", old_ids)
            db.execute("DELETE FROM characters WHERE block=?", (bid,))

        # 目標碼位＝範圍內、Unihan 有 kRSUnicode 者（＝已指派表意文字）
        cps = sorted(cp for cp in range(lo, hi + 1)
                     if cp in uni and uni[cp].get("has_rs"))
        char_rows, reading_rows, comp_rows = [], [], []
        n_read = n_ids = 0
        for cp in cps:
            info = uni[cp]
            cid = next_id
            next_id += 1
            ch = chr(cp)
            ids = ids_map.get(cp)
            if ids:
                n_ids += 1
            char_rows.append((
                cid, ch, cp, f"U+{cp:04X}", bid,
                info.get("rad"), info.get("str"),
                None, None, None, None, None,   # stroke_other, wuxing, freq_all/trad/simp
                None, None, ids, None,          # kangxi_loc, kangxi_text, ids, ids_legacy
                None, None, None, None, None,   # var_sc/tt/tsr, reading_a/b
            ))
            for idx, r in enumerate(to_readings(info.get("py"), p2b), start=1):
                reading_rows.append((cid, idx, r))
                n_read += 1
            for comp in parse_components(ids, ch):
                comp_rows.append((cid, comp))

        db.executemany("INSERT INTO characters VALUES (%s)" % ",".join("?" * 21), char_rows)
        db.executemany("INSERT INTO readings VALUES (?,?,?)", reading_rows)
        db.executemany("INSERT OR IGNORE INTO char_components VALUES (?,?)", comp_rows)
        total_added += len(char_rows)
        total_readings += n_read
        print(f"      Ext {letter}: 收錄 {len(char_rows)} 字、讀音 {n_read} 筆、IDS {n_ids} 字"
              f"（block id={bid}）")

    # provenance
    db.execute("INSERT OR REPLACE INTO meta(key,value) VALUES ('ext_source',?)",
               ("Ext G/H/I/J 由 data/ingest_ext.py 補入：部首/筆畫/讀音自 Unicode 17.0 Unihan，"
                "IDS 部件拆分自 CHISE chise/ids（"
                + datetime.datetime.now().strftime("%Y-%m-%d") + "）",))

    print("[2/5] 建立索引一致性（VACUUM）…")
    db.commit()
    db.execute("VACUUM")
    db.commit()

    print("[3/5] 重算 stats.json …")
    recompute_stats(db)

    print("[4/5] 驗收：")
    for letter, (bid, *_rest) in targets.items():
        n = db.execute("SELECT COUNT(*) FROM characters WHERE block=?", (bid,)).fetchone()[0]
        nr = db.execute("SELECT COUNT(*) FROM characters c WHERE block=? "
                        "AND EXISTS(SELECT 1 FROM readings r WHERE r.char_id=c.id)",
                        (bid,)).fetchone()[0]
        print(f"      Ext {letter}: {n} 字，其中 {nr} 字有注音讀音")
    print(f"      characters 總數：{db.execute('SELECT COUNT(*) FROM characters').fetchone()[0]}")

    db.close()
    print(f"[5/5] 完成。新增 {total_added} 字、{total_readings} 讀音。")
    print("      接著：cd web && npm run setup-data（複製到 public/data），"
          "並於 web/src/lib/constants.ts 把對應區塊 inSystem 設 true、id 設好。")


if __name__ == "__main__":
    main()

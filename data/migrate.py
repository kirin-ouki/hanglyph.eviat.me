#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CHCT Phase 0 — 資料解放：Access(Char.mdb) -> 乾淨 SQLite + CSV/JSON 開放資料 + DATA.md

用法：
    python data/migrate.py [來源.mdb] [輸出目錄]
預設來源 = CHCT/Char.mdb，輸出 = data/dist/

產物：
    data/dist/char.sqlite          # 正規化、正名、修型後的資料庫（Web App 與工具的標準來源）
    data/dist/csv/*.csv            # 每張表的 UTF-8 CSV（標準大型匯出）
    data/dist/json/*.json          # 查找表與小型表的 JSON
    data/dist/stats.json           # 驗證統計
    DATA.md                        # 由實際資料產生的資料字典與出處說明
"""
import os, sys, re, csv, json, sqlite3, datetime
import pyodbc

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_MDB = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "CHCT", "Char.mdb")
OUT_DIR = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "data", "dist")
CSV_DIR = os.path.join(OUT_DIR, "csv")
JSON_DIR = os.path.join(OUT_DIR, "json")
SQLITE_PATH = os.path.join(OUT_DIR, "char.sqlite")
DATA_MD = os.path.join(ROOT, "DATA.md")

# ---- 查找表（取自原程式 a_Zone / C_CZCheck / a_WX）-------------------------
BLOCKS = [
    (0,  "CJK Unified Ideographs",                  "中日韓統一表意文字"),
    (1,  "CJK Unified Ideographs Extension A",      "中日韓統一表意文字擴展A區"),
    (2,  "CJK Unified Ideographs Extension B",      "中日韓統一表意文字擴展B區"),
    (3,  "CJK Unified Ideographs Extension C",      "中日韓統一表意文字擴展C區"),
    (4,  "CJK Unified Ideographs Extension D",      "中日韓統一表意文字擴展D區"),
    (5,  "CJK Unified Ideographs Extension E",      "中日韓統一表意文字擴展E區"),
    (6,  "CJK Unified Ideographs Extension F",      "中日韓統一表意文字擴展F區"),
    (11, "CJK Compatibility Ideographs",            "中日韓相容表意文字"),
    (12, "CJK Compatibility Ideographs Supplement", "中日韓相容表意文字增補"),
]
WUXING = [
    (1, "metal", "金"), (2, "wood", "木"), (3, "water", "水"),
    (4, "fire", "火"),  (5, "earth", "土"),
]

# IDS 表意文字描述運算子（結構符號，非部件本身）
IDS_OP_LO, IDS_OP_HI = 0x2FF0, 0x2FFF
ENTITY_RE = re.compile(r"&[^;\s]+;")


def clean_str(v):
    """去頭尾空白；空字串或 'N/A' -> None。"""
    if v is None:
        return None
    s = str(v).strip()
    if s == "" or s == "N/A":
        return None
    return s


def clean_short(v, drop_le=None):
    """轉 int；None/空 -> None。drop_le：<= 此值者視為「無資料」-> None。"""
    if v is None or v == "":
        return None
    try:
        n = int(round(float(v)))
    except (ValueError, TypeError):
        return None
    if drop_le is not None and n <= drop_le:
        return None
    return n


def parse_components(ids, self_char):
    """從 IDS 拆分字串解析出直接部件 token（去 IDS 運算子，&entity; 視為單一部件，去自身）。"""
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


SCHEMA = """
PRAGMA journal_mode = OFF;
PRAGMA synchronous = OFF;

CREATE TABLE blocks (id INTEGER PRIMARY KEY, name_en TEXT, name_zh TEXT);
CREATE TABLE wuxing (id INTEGER PRIMARY KEY, name_en TEXT, name_zh TEXT);

CREATE TABLE characters (
    id            INTEGER PRIMARY KEY,   -- 原 C_ID
    char          TEXT NOT NULL,         -- 原 C_CHAR
    codepoint     INTEGER NOT NULL,      -- 原 C_UDEC（double->int 修正）
    codepoint_hex TEXT NOT NULL,         -- 衍生 U+XXXX
    block         INTEGER,               -- 原 C_CZ  -> blocks.id
    radical_no    INTEGER,               -- 原 C_RDCN (1..214)
    stroke_total  INTEGER,               -- 原 C_STKT，-1 -> NULL
    stroke_other  INTEGER,               -- 原 C_STKO（語意待確認）
    wuxing        INTEGER,               -- 原 C_WX -> wuxing.id，-1 -> NULL
    freq_all      INTEGER,               -- 原 C_FQA（0 視為無資料 -> NULL）
    freq_trad     INTEGER,               -- 原 C_FQT
    freq_simp     INTEGER,               -- 原 C_FQS
    kangxi_loc    TEXT,                  -- 原 C_KXC，N/A -> NULL
    kangxi_text   TEXT,                  -- 原 C_CMT 康熙字典釋義全文
    ids           TEXT,                  -- 原 C_PTA IDS 拆分序列，N/A -> NULL
    ids_legacy    TEXT,                  -- 原 C_PT（舊部件欄，已被 ids 取代）
    var_sc        INTEGER,               -- 原 C_SC（簡繁/異體，語意待確認）
    var_tt        INTEGER,               -- 原 C_TT（語意待確認）
    var_tsr       TEXT,                  -- 原 C_TSR（語意待確認）
    reading_a     TEXT,                  -- 原 C_RPA（語意待確認）
    reading_b     TEXT                   -- 原 C_RPB（語意待確認）
);

CREATE TABLE readings (            -- 由 C_PH1..C_PH10 正規化（一字多音）
    char_id  INTEGER NOT NULL,
    idx      INTEGER NOT NULL,     -- 1..10，1 為主讀音
    bopomofo TEXT NOT NULL,
    PRIMARY KEY (char_id, idx)
);

CREATE TABLE romanization (        -- 原 Phoenics：注音 -> 多系統羅馬化對照
    bopomofo       TEXT PRIMARY KEY,  -- 原 MPS1
    wade_giles     TEXT,              -- WG
    mps2           TEXT,              -- MPS2 注音第二式
    yale           TEXT,              -- YALE
    tongyong       TEXT,              -- TY 通用拼音
    hanyu_pinyin   TEXT,              -- HYPY 漢語拼音
    efeo           TEXT,              -- EFEO 法國遠東學院
    lessing_othmer TEXT,              -- LOS 德國式
    gr1 TEXT, gr2 TEXT, gr3 TEXT, gr4 TEXT,  -- GRT1..4 國語羅馬字
    ipa            TEXT               -- IPA
);

CREATE TABLE components_standard (id INTEGER PRIMARY KEY, comp TEXT, stroke INTEGER, freq INTEGER); -- PartB
CREATE TABLE components_radical  (id INTEGER PRIMARY KEY, comp TEXT, stroke INTEGER, freq INTEGER); -- PartK
CREATE TABLE components_custom   (id INTEGER PRIMARY KEY, comp TEXT, stroke INTEGER, freq INTEGER); -- PartC

CREATE TABLE char_components (     -- C_PTA 反查索引：字 -> 直接部件
    char_id   INTEGER NOT NULL,
    component TEXT NOT NULL,
    PRIMARY KEY (char_id, component)
);

CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
"""

INDEXES = """
CREATE INDEX idx_char ON characters(char);  -- 非唯一：相容區字元可能與統一區同形
CREATE INDEX idx_codepoint   ON characters(codepoint);
CREATE INDEX idx_radical     ON characters(radical_no);
CREATE INDEX idx_stroke      ON characters(stroke_total);
CREATE INDEX idx_wuxing      ON characters(wuxing);
CREATE INDEX idx_block       ON characters(block);
CREATE INDEX idx_freq_all    ON characters(freq_all);
CREATE INDEX idx_readings_ch ON readings(char_id);
CREATE INDEX idx_readings_bp ON readings(bopomofo);
CREATE INDEX idx_cc_comp     ON char_components(component);
"""


def main():
    os.makedirs(CSV_DIR, exist_ok=True)
    os.makedirs(JSON_DIR, exist_ok=True)
    if os.path.exists(SQLITE_PATH):
        os.remove(SQLITE_PATH)

    print(f"[1/7] 連線 Access：{SRC_MDB}")
    cs = r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=%s;" % SRC_MDB
    acc = pyodbc.connect(cs)
    ac = acc.cursor()

    db = sqlite3.connect(SQLITE_PATH)
    db.executescript(SCHEMA)
    cur = db.cursor()

    cur.executemany("INSERT INTO blocks VALUES (?,?,?)", BLOCKS)
    cur.executemany("INSERT INTO wuxing VALUES (?,?,?)", WUXING)

    stats = {}

    # ---- characters + readings + char_components ---------------------------
    print("[2/7] 轉換 CharX -> characters / readings / char_components …")
    ac.execute("""SELECT C_ID,C_CHAR,C_PT,C_PTA,C_UDEC,C_RDCN,C_STKO,C_STKT,C_WX,C_CZ,
                         C_SC,C_TT,C_TSR,C_KXC,C_CMT,C_RPA,C_RPB,
                         C_PH1,C_PH2,C_PH3,C_PH4,C_PH5,C_PH6,C_PH7,C_PH8,C_PH9,C_PH10,
                         C_FQS,C_FQT,C_FQA
                  FROM CharX ORDER BY C_ID""")
    char_rows, reading_rows, comp_rows = [], [], []
    n_reading = n_comp = 0
    for r in ac.fetchall():
        (cid, ch, c_pt, pta, udec, rdcn, stko, stkt, wx, cz, sc, tt, tsr,
         kxc, cmt, rpa, rpb, ph1, ph2, ph3, ph4, ph5, ph6, ph7, ph8, ph9, ph10,
         fqs, fqt, fqa) = r
        cp = int(round(float(udec))) if udec is not None else None
        ch = (ch or "").strip()
        ids = clean_str(pta)
        char_rows.append((
            cid, ch, cp, (f"U+{cp:04X}" if cp is not None else None),
            clean_short(cz), clean_short(rdcn, drop_le=0), clean_short(stkt, drop_le=-1),
            clean_short(stko, drop_le=-1), clean_short(wx, drop_le=0),
            clean_short(fqa, drop_le=0), clean_short(fqt, drop_le=0), clean_short(fqs, drop_le=0),
            clean_str(kxc), clean_str(cmt), ids, clean_str(c_pt),
            clean_short(sc, drop_le=-1), clean_short(tt, drop_le=-1), clean_str(tsr),
            clean_str(rpa), clean_str(rpb),
        ))
        for idx, ph in enumerate((ph1, ph2, ph3, ph4, ph5, ph6, ph7, ph8, ph9, ph10), start=1):
            pv = clean_str(ph)
            if pv:
                # 原始資料偶見漢字「一」(U+4E00) 誤植為注音「ㄧ」(U+3127)，正規化之。
                pv = pv.replace("一", "ㄧ")
                reading_rows.append((cid, idx, pv)); n_reading += 1
        for comp in parse_components(ids, ch):
            comp_rows.append((cid, comp)); n_comp += 1

    cur.executemany("INSERT INTO characters VALUES (%s)" % ",".join("?" * 21), char_rows)
    cur.executemany("INSERT INTO readings VALUES (?,?,?)", reading_rows)
    cur.executemany("INSERT OR IGNORE INTO char_components VALUES (?,?)", comp_rows)
    stats["characters"] = len(char_rows)
    stats["readings"] = n_reading
    stats["char_components"] = n_comp

    # ---- romanization ------------------------------------------------------
    print("[3/7] 轉換 Phoenics -> romanization …")
    ac.execute("""SELECT MPS1,WG,MPS2,YALE,TY,HYPY,EFEO,LOS,GRT1,GRT2,GRT3,GRT4,IPA
                  FROM Phoenics ORDER BY ID""")
    rom_rows = [tuple(clean_str(v) for v in row) for row in ac.fetchall()]
    rom_rows = [r for r in rom_rows if r[0]]  # 必須有注音主鍵
    cur.executemany("INSERT OR IGNORE INTO romanization VALUES (%s)" % ",".join("?" * 13), rom_rows)
    stats["romanization"] = len(rom_rows)

    # ---- components_* ------------------------------------------------------
    print("[4/7] 轉換 PartB/PartK/PartC -> components_* …")
    for src, dst in (("PartB", "components_standard"), ("PartK", "components_radical"),
                     ("PartC", "components_custom")):
        ac.execute(f"SELECT P_ID,P_CHAR,P_STKT,P_FQC FROM {src} ORDER BY P_ID")
        rows = [(pid, clean_str(pc), clean_short(ps), clean_short(pf))
                for (pid, pc, ps, pf) in ac.fetchall()]
        cur.executemany(f"INSERT INTO {dst} VALUES (?,?,?,?)", rows)
        stats[dst] = len(rows)

    # ---- meta --------------------------------------------------------------
    gen = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    meta = {
        "title": "CHCT 中文字元資料庫（開放資料）",
        "source": "原 CHCT 桌面程式 Char.mdb（2017）經 data/migrate.py 遷移",
        "generated_at": gen,
        "schema_version": "1.0",
        "license_code": "MIT（程式碼）",
        "license_data": "見 DATA.md 各欄位來源與授權說明（部分來源待確認）",
    }
    cur.executemany("INSERT INTO meta VALUES (?,?)", list(meta.items()))

    db.executescript(INDEXES)

    # ---- FTS5（康熙釋義全文檢索，Phase 3 用；不支援則跳過）-----------------
    fts_ok = False
    try:
        cur.execute("CREATE VIRTUAL TABLE characters_fts USING fts5("
                    "kangxi_text, content='characters', content_rowid='id')")
        cur.execute("INSERT INTO characters_fts(rowid, kangxi_text) "
                    "SELECT id, kangxi_text FROM characters WHERE kangxi_text IS NOT NULL")
        fts_ok = True
    except sqlite3.OperationalError as e:
        print(f"    （FTS5 不可用，略過：{e}）")
    stats["fts5"] = fts_ok

    db.commit()
    cur.execute("VACUUM")
    db.commit()

    # ---- 匯出 CSV / JSON ----------------------------------------------------
    print("[5/7] 匯出 CSV / JSON 開放資料 …")
    export_csv(db, "characters",
               "id,char,codepoint,codepoint_hex,block,radical_no,stroke_total,stroke_other,"
               "wuxing,freq_all,freq_trad,freq_simp,kangxi_loc,kangxi_text,ids,ids_legacy,"
               "var_sc,var_tt,var_tsr,reading_a,reading_b")
    export_csv(db, "readings", "char_id,idx,bopomofo")
    export_csv(db, "char_components", "char_id,component")
    for t in ("romanization", "components_standard", "components_radical",
              "components_custom", "blocks", "wuxing", "meta"):
        export_csv(db, t, None)
        export_json(db, t)

    # ---- 驗證 ---------------------------------------------------------------
    print("[6/7] 驗證 …")
    stats["completeness"] = {
        "stroke_total":  scalar(db, "SELECT COUNT(*) FROM characters WHERE stroke_total IS NOT NULL"),
        "ids":           scalar(db, "SELECT COUNT(*) FROM characters WHERE ids IS NOT NULL"),
        "radical_no":    scalar(db, "SELECT COUNT(*) FROM characters WHERE radical_no IS NOT NULL"),
        "wuxing":        scalar(db, "SELECT COUNT(*) FROM characters WHERE wuxing IS NOT NULL"),
        "freq_all":      scalar(db, "SELECT COUNT(*) FROM characters WHERE freq_all IS NOT NULL"),
        "kangxi_text":   scalar(db, "SELECT COUNT(*) FROM characters WHERE kangxi_text IS NOT NULL"),
        "has_reading":   scalar(db, "SELECT COUNT(DISTINCT char_id) FROM readings"),
    }
    stats["block_dist"] = dict(db.execute(
        "SELECT block, COUNT(*) FROM characters GROUP BY block ORDER BY block").fetchall())
    stats["duplicate_chars"] = scalar(db,
        "SELECT COUNT(*) FROM (SELECT char FROM characters GROUP BY char HAVING COUNT(*)>1)")
    stats["sqlite_bytes"] = os.path.getsize(SQLITE_PATH)
    with open(os.path.join(OUT_DIR, "stats.json"), "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    db.close(); acc.close()

    print("[7/7] 產生 DATA.md …")
    write_data_md(stats, meta)

    print("\n完成。SQLite：%s（%.1f MB）" % (SQLITE_PATH, stats["sqlite_bytes"] / 1e6))
    for k in ("characters", "readings", "char_components", "romanization",
              "components_standard", "components_radical", "components_custom"):
        print(f"  {k:22s} {stats[k]:>8d}")
    print("  completeness:", stats["completeness"])


def scalar(db, sql):
    return db.execute(sql).fetchone()[0]


def export_csv(db, table, columns):
    cols = columns.split(",") if columns else [r[1] for r in db.execute(f"PRAGMA table_info({table})")]
    path = os.path.join(CSV_DIR, f"{table}.csv")
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for row in db.execute(f"SELECT {','.join(cols)} FROM {table}"):
            w.writerow(["" if v is None else v for v in row])


def export_json(db, table):
    cols = [r[1] for r in db.execute(f"PRAGMA table_info({table})")]
    rows = [dict(zip(cols, row)) for row in db.execute(f"SELECT * FROM {table}")]
    with open(os.path.join(JSON_DIR, f"{table}.json"), "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)


def write_data_md(stats, meta):
    c = stats["completeness"]; total = stats["characters"]
    def pct(n): return f"{n:,}（{n/total*100:.0f}%）"
    md = f"""# CHCT 開放資料字典（DATA.md）

> 由 `data/migrate.py` 於 {meta['generated_at']} 自原始 `Char.mdb` 自動產生。
> schema 版本 {meta['schema_version']}。本檔同時是資料來源與授權的說明文件。

## 產物
| 檔案 | 說明 |
|---|---|
| `data/dist/char.sqlite` | 正規化 SQLite（Web App 標準來源），約 {stats['sqlite_bytes']/1e6:.1f} MB，FTS5={'有' if stats['fts5'] else '無'} |
| `data/dist/csv/*.csv` | 每張表 UTF-8 CSV（標準大型匯出） |
| `data/dist/json/*.json` | 查找表與小型表 JSON |
| `data/dist/stats.json` | 驗證統計 |

## 規模
| 表 | 列數 |
|---|---|
| characters | {stats['characters']:,} |
| readings（一字多音正規化） | {stats['readings']:,} |
| char_components（IDS 反查） | {stats['char_components']:,} |
| romanization | {stats['romanization']:,} |
| components_standard / radical / custom | {stats['components_standard']} / {stats['components_radical']} / {stats['components_custom']} |

## `characters` 欄位（含原欄位對照）
| 欄位 | 來源 | 說明 | 填充率 |
|---|---|---|---|
| id | C_ID | 主鍵 | 100% |
| char | C_CHAR | 字元 | 100% |
| codepoint / codepoint_hex | C_UDEC | Unicode 碼位（已修為整數）/ U+XXXX | 100% |
| block | C_CZ | Unicode 區塊（→ `blocks`） | 100% |
| radical_no | C_RDCN | 康熙部首 1–214 | {pct(c['radical_no'])} |
| stroke_total | C_STKT | 總筆畫（原 -1 → NULL） | {pct(c['stroke_total'])} |
| stroke_other | C_STKO | 筆畫（語意待確認） | — |
| wuxing | C_WX | 五行（→ `wuxing`，原 -1 → NULL） | {pct(c['wuxing'])} |
| freq_all / freq_trad / freq_simp | C_FQA/T/S | 頻率分級（0 → NULL，語意待確認） | freq_all {pct(c['freq_all'])} |
| kangxi_loc | C_KXC | 康熙字典出處 | — |
| kangxi_text | C_CMT | 康熙字典釋義全文 | {pct(c['kangxi_text'])} |
| ids | C_PTA | IDS 部件拆分序列 | {pct(c['ids'])} |
| ids_legacy | C_PT | 舊部件欄（已被 ids 取代） | — |
| var_sc / var_tt / var_tsr | C_SC/C_TT/C_TSR | 簡繁/異體（語意待確認） | — |
| reading_a / reading_b | C_RPA / C_RPB | 讀音（語意待確認） | — |
| （讀音） | C_PH1..C_PH10 | 已正規化至 `readings` 表 | 至少一讀音 {pct(c['has_reading'])} |

## `romanization`（原 Phoenics，注音→多系統）
bopomofo(MPS1) 主鍵；wade_giles、mps2、yale、tongyong、hanyu_pinyin、efeo、
lessing_othmer、gr1–gr4（國語羅馬字）、ipa。

## 查找表
- `blocks`：{len(BLOCKS)} 區塊（id / name_en / name_zh）。
- `wuxing`：1=金 2=木 3=水 4=火 5=土。

## ⚠ 授權與來源（開源前必處理）
| 資料 | 研判 | 行動 |
|---|---|---|
| kangxi_text / kangxi_loc | 康熙字典原典公有領域（1716） | 可用；若取自某數位化專案需標出處 |
| codepoint/block/radical/stroke | Unicode 衍生，授權寬鬆 | 標註 Unihan 來源 |
| ids | 多源自開放 IDS 計畫 | 確認並標註 |
| readings / romanization / freq_* | **來源不明，風險最高** | 上線前務必確認或替換為開放來源 |

## ⚠ 待作者確認語意
`freq_all/trad/simp` 定義與方向、`stroke_other`、`reading_a/b`、`var_sc/tt/tsr`、
`readings.idx` 是否有主音/又音語意。詳見 `AI_IMPLEMENTATION.md` §11。

## 重現方式
```bash
pip install pyodbc
python data/migrate.py            # 預設讀 CHCT/Char.mdb，輸出 data/dist/
```
"""
    with open(DATA_MD, "w", encoding="utf-8") as f:
        f.write(md)


if __name__ == "__main__":
    main()

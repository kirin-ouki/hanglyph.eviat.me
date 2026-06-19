# CHCT 開放資料字典（DATA.md）

> 由 `data/migrate.py` 於 2026-06-19 13:29:19 自原始 `Char.mdb` 自動產生。
> schema 版本 1.0。本檔同時是資料來源與授權的說明文件。

## 產物
| 檔案 | 說明 |
|---|---|
| `data/dist/char.sqlite` | 正規化 SQLite（Web App 標準來源），約 42.9 MB，FTS5=有 |
| `data/dist/csv/*.csv` | 每張表 UTF-8 CSV（標準大型匯出） |
| `data/dist/json/*.json` | 查找表與小型表 JSON |
| `data/dist/stats.json` | 驗證統計 |

## 規模
| 表 | 列數 |
|---|---|
| characters | 88,966 |
| readings（一字多音正規化） | 89,216 |
| char_components（IDS 反查） | 166,736 |
| romanization | 411 |
| components_standard / radical / custom | 500 / 214 / 6 |

## `characters` 欄位（含原欄位對照）
| 欄位 | 來源 | 說明 | 填充率 |
|---|---|---|---|
| id | C_ID | 主鍵 | 100% |
| char | C_CHAR | 字元 | 100% |
| codepoint / codepoint_hex | C_UDEC | Unicode 碼位（已修為整數）/ U+XXXX | 100% |
| block | C_CZ | Unicode 區塊（→ `blocks`） | 100% |
| radical_no | C_RDCN | 康熙部首 1–214 | 80,921（91%） |
| stroke_total | C_STKT | 總筆畫（原 -1 → NULL） | 75,159（84%） |
| stroke_other | C_STKO | 筆畫（語意待確認） | — |
| wuxing | C_WX | 五行（→ `wuxing`，原 -1 → NULL） | 9,640（11%） |
| freq_all / freq_trad / freq_simp | C_FQA/T/S | 頻率分級（0 → NULL，語意待確認） | freq_all 9,467（11%） |
| kangxi_loc | C_KXC | 康熙字典出處 | — |
| kangxi_text | C_CMT | 康熙字典釋義全文 | 46,816（53%） |
| ids | C_PTA | IDS 部件拆分序列 | 74,868（84%） |
| ids_legacy | C_PT | 舊部件欄（已被 ids 取代） | — |
| var_sc / var_tt / var_tsr | C_SC/C_TT/C_TSR | 簡繁/異體（語意待確認） | — |
| reading_a / reading_b | C_RPA / C_RPB | 讀音（語意待確認） | — |
| （讀音） | C_PH1..C_PH10 | 已正規化至 `readings` 表 | 至少一讀音 71,098（80%） |

## `romanization`（原 Phoenics，注音→多系統）
bopomofo(MPS1) 主鍵；wade_giles、mps2、yale、tongyong、hanyu_pinyin、efeo、
lessing_othmer、gr1–gr4（國語羅馬字）、ipa。

## 查找表
- `blocks`：9 區塊（id / name_en / name_zh）。
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

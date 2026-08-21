# 資料追上計畫：收錄 Ext G/H/I/J 及補齊缺漏碼位

> 目標：讓資料庫追上現行 Unicode（17.0, 2025）的全部 CJK 表意文字，
> 使「區塊涵蓋」頁的 G/H/I/J 由「未收錄」轉為實收，並讓查字／篩選能查到這些字。
> 字型端（Plangothic 補 Ext C–J，含第 3 平面）**已就緒**，見 [`../web/PLANGOTHIC.md`](../web/PLANGOTHIC.md)。
>
> ✅ **狀態（已執行）**：[`ingest_ext.py`](ingest_ext.py) 已補入 Ext G(4,939)／H(4,192)／
> I(622)／J(4,298) 共 14,051 字，13/13 區塊已收、整體達碼位容量 99.95%。各欄覆蓋：
> **部首＋總筆畫** 全覆蓋（Unicode 17.0 Unihan）；**IDS 部件拆分** G 4,939／H 4,189／I 622／
> J 4,292（CHISE `chise/ids`，近全覆蓋，已建 `char_components` 反查）；**讀音** kMandarin 所及
> （G 1,121／H 227／I 99／J 0）。
> **待辦**：① 補既有區塊零碎缺口（URO/Compat 尾端）；② 把流程併入發佈／CI 管線。

## 現況與缺口
- 現有資料源 `CHCT/Char.mdb` 凍結於 2017，僅含 blocks 0–6、11、12（共 88,966 字）。
- 完全未收：**Ext G（U13.0）/ H（U15.0）/ I（U15.1）/ J（U17.0）**，約 14,051 字（已指派）。
- 既有區塊的少數尾端零碎追加（如 URO 的 U+9FBC–U+9FC3 一帶、Ext C 的 U+2B73A–U+2B73F）也可一併補齊。
- `migrate.py` 由 mdb 一次性重建；新擴展沒有 mdb 來源，需另接**補充資料源**。

## 資料源（皆為開放授權，可再散布）
| 欄位 | 來源 | 取得 |
|---|---|---|
| 碼位 / 字 / 區塊 | 由碼位直接推導（`chr(cp)`、`Blocks.txt`）| Unicode UCD |
| 部首 + 部首外筆畫 | Unihan `kRSUnicode`（如 `9.13`）| Unihan_RadicalStrokeCounts.txt |
| 總筆畫 | Unihan `kTotalStrokes` | 同上 |
| 讀音（注音）| Unihan `kMandarin`（漢語拼音）→ romanization 表反查注音 | Unihan_Readings.txt |
| IDS 部件拆分 | [`chise/ids`](https://github.com/chise/ids) 的 `IDS-UCS-Ext-{G,H,I,J}.txt`（**含 Ext J**）| GitHub raw |
| 釋義 | 多為現代新增字，**康熙無收**，留 NULL（少數 `kIRGKangXi` 僅位置）| — |
| 五行 / 頻率 | 原專案專有衍生資料，新字**無對應**，留 NULL | — |

> ⚠ 授權：Unihan 屬 Unicode License（寬鬆、需標示）；`chise/ids` 倉庫標示為 **GPL**
> （IDS 屬事實性資料，GPL 是否及於衍生資料庫須釐清）。散布前於 `DATA.md` 補列來源與授權，
> 與既有「讀音／羅馬化來源待確認」一併處理。

## 實作步驟（建議獨立於 migrate.py，新增 `data/ingest_ext.py`）
1. **取得來源檔**：下載並快取 Unihan.zip 與 `cjkvi/ids` 到 `data/sources/`（gitignore）。
2. **擴充 `blocks`**：於 `migrate.py` 的 `BLOCKS` 增列 `(7,G)…(10,J)`（7–10 尚未使用；11/12 為相容區）。
   同步更新前端 [`web/src/lib/constants.ts`](../web/src/lib/constants.ts) 的 `CJK_BLOCKS`：把 G/H/I/J 的
   `id` 由 `null` 設為對應值、`inSystem` 設 `true`（`BlocksView` 會自動重算覆蓋率）。
3. **產生補充列**：對目標碼位（先 G/H/I/J，再選擇性補既有區塊缺口），自 `id = MAX(id)+1` 起，
   逐字組出 `characters` 列（codepoint/hex/block/radical_no/stroke_total/ids），可得讀音者寫入 `readings`，
   並重建 `char_components`（用既有 `parse_components()`）。其餘欄位 NULL。
4. **拼音→注音**：建一張對照表把 `kMandarin` 的漢語拼音轉注音，沿用既有 `readings`＋`romanization` 機制；
   無讀音者略過（不阻擋收錄）。
5. **重建衍生物**：重新產生 FTS5、CSV/JSON、`stats.json`、`DATA.md`（沿用 migrate.py 既有函式）。
6. **發佈**：`char.sqlite` 走 GitHub Releases（見 README「發佈資料與部署」），檔案會變大（+~14k 字）。

## 驗收
- `stats.json` 的 `block_dist` 出現鍵 `7/8/9/10`，數量對齊 Unicode 17.0（G 4939、H 4192、I 622、J 4298）。
- 「區塊涵蓋」頁 G/H/I/J 由「未收錄」變為實收，整體（對全部 CJK）涵蓋率明顯上升。
- 開啟「補字字型」後，查 Ext J 範例字（如 U+323B0）可正常顯示（Plangothic P2）。
- `data/validate.py` 通過列數／完整度檢查。

## 範圍與優先序
1. **先 J、G、H、I**（整段未收、價值最高）。
2. 再補既有區塊零碎缺口（URO/Compat 尾端少數碼位）。
3. 讀音、IDS 能補多少補多少；缺者留 NULL，不阻擋字本身被收錄與顯示。

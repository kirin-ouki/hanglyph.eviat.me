# CHCT — AI 實作與重建指引（AI_IMPLEMENTATION.md）

> 本文件供 AI 代理／開發者閱讀，用以理解現有 CHCT 桌面程式、評估其價值與問題，
> 並依此將它重建為**開源 Web 版本**。文件以繁體中文撰寫，技術識別字（資料表、欄位、API）保留英文。
>
> 產生日期：2026-06-19　|　評估對象：CHCT（2017，C# / WPF / .NET Framework）

---

## 0. 一句話總結

CHCT 是一套單人開發的桌面工具，**真正的資產是它背後那份近 9 萬字、欄位極豐富的中文字元資料庫**
（含完整康熙字典釋義、IDS 部件拆分、注音、部首筆畫、五行、頻率、多系統羅馬拼音轉換）。
程式碼本身是 2017 年的 WPF code-behind，架構老舊、平台綁死 Windows，**不值得移植，但資料非常值得重生**。
**結論：強烈建議以「資料優先」的方式重建為開源 Web 版；程式邏輯重寫，資料庫遷移保留。**

---

## 1. 現況總覽

### 1.1 技術堆疊
| 項目 | 內容 | 備註 |
|---|---|---|
| 語言 / UI | C# + WPF（XAML） | 純 code-behind，無 MVVM |
| 執行框架 | .NET Framework v4.8（原 4.6.1） | Windows 專用 |
| 開發工具 | Visual Studio 2015 / 2017 | `CHCT.sln` 格式 v12 |
| 資料庫 | Microsoft Access `Char.mdb`（約 50 MB） | 透過 Jet/ACE OLEDB 存取 |
| 資料存取層 | 強型別 DataSet（`CharDataSet.xsd` + TableAdapters） | 已淘汰的技術 |
| 部署 | ClickOnce（`System.Deployment`） | 舊式部署 |

### 1.2 檔案地圖
| 檔案 | 行數 / 大小 | 角色 |
|---|---|---|
| `CHCT/MainWindow.xaml(.cs)` | 1554 行 | 主視窗：查詢、篩選、字元格、拆分樹、標音、輸出。**核心邏輯全在此** |
| `CHCT/CHCTOption.xaml(.cs)` | 542 行 | 設定視窗：字型、標音系統、自訂部件管理 |
| `CHCT/ColorPicker.xaml(.cs)` | 小 | 顏色選擇輔助 |
| `CHCT/CharDataSet.xsd / .Designer.cs` | 606 KB（自動產生） | 資料表結構與 SQL（含全部 CRUD CommandText） |
| `CHCT/Char.mdb` | 50 MB | **資料本體**（不應進版控，見 §5） |
| `CHCT/App.config` | — | 連線字串 + 使用者偏好（字型／標音／顏色／字級） |
| `JEKExt`（內嵌於 MainWindow.xaml.cs） | — | `UTF32` 字串拆解、`bool?` 工具 |

### 1.3 程式結構特徵
- 所有狀態集中在 `MainWindow.Globals`（static）與 `CHCTOption.Globals`（static）。
- 篩選按鈕（214 康熙部首、64 筆畫、部件、五行、字區…）皆於載入時**動態 new 出來**並掛事件。
- 啟動時一次性 `Fill` 全部 88,966 列進記憶體，之後查詢用 **LINQ-to-Objects** 在記憶體中過濾。
- 字型涵蓋判斷（某字體是否含某字）以 WPF `GlyphTypeface.CharacterToGlyphMap` 逐字逐 typeface 掃描。

---

## 2. 資料庫剖析（**最重要章節**）

資料庫即價值所在。以下為實測（2026-06-19，ACE OLEDB 直接查詢）。

### 2.1 資料表與規模
| 資料表 | 列數 | 用途 |
|---|---|---|
| `CharX` | **88,966** | 字元主檔（CJK 統一表意文字 + 擴展 A–F + 相容區，約等於 Unicode 8/9 之全集） |
| `PartB` | 500 | 標準漢字部件 |
| `PartC` | 6 | 使用者自訂部件 |
| `PartK` | 214 | 康熙部首（作為部件） |
| `Phoenics` | 411 | 注音→多系統羅馬拼音「轉換表」（每列一個注音音節） |
| `Version` | 1 | 版本資訊 |

### 2.2 `CharX` 欄位字典
> 命名為作者自訂縮寫，含義經程式碼與資料反推。標「⚠ 待確認」者需作者確認語意。

| 欄位 | 型別 | 含義 | 填充率 / 備註 |
|---|---|---|---|
| `C_ID` | int | 流水號主鍵 | 100% |
| `C_CHAR` | string | 字元本身 | 100% |
| `C_PT` | string | 舊版部件欄（已被 `C_PTA` 取代） | ⚠ 似為遺留 |
| `C_UDEC` | **double** | Unicode 碼位（十進位） | 100%。**型別應為 int**，存成 double 是缺陷 |
| `C_RDCN` | short | 康熙部首編號（1–214） | 80,921 |
| `C_STKO` | short | 部首/外筆畫數 ⚠ 待確認 | — |
| `C_STKT` | short | **總筆畫數**；`-1` = 尚未建檔 | 75,159（其餘 -1） |
| `C_WX` | short | **五行**（0–5 對應 無/金/木/水/火/土）；`-1` = 未指定 | 9,640（姓名學用） |
| `C_CZ` | short | Unicode 區塊代號（見 §2.4） | 100% |
| `C_SC` / `C_TT` / `C_TSR` | short/short/str | 簡繁/異體相關 ⚠ 待確認 | 多數未填 |
| `C_KXC` | string | 康熙字典出處（如 `【子集上】【一字部】`），無則 `N/A` | 100%（含 N/A） |
| `C_CMT` | memo | **康熙字典完整釋義原文**（〔古文〕…【唐韻】…【說文】…） | 100%，**核心資產** |
| `C_RPA` / `C_RPB` | string(12) | 拼音/讀音 A、B ⚠ 待確認 | — |
| `C_PH1`–`C_PH10` | string(10) | 讀音欄；`C_PH1` = 主注音，`PH2+` = 多音字其他讀音，無則 `N/A` | PH1 100% |
| `C_FQS` / `C_FQT` / `C_FQA` | short | 頻率分級：簡(S)/繁(T)/通用(A)，數字越大越常用 ⚠ 語意待確認 | FQA>0 者 9,467 |
| `C_PTA` | string | **IDS 表意文字拆分序列**（如 `⿱宀子`、`⿳&CDP-8BB8;心夂`），未拆 `N/A` | 74,868 |

**填充率重點**：注音、康熙釋義、康熙出處、字區 ≈ 100%；部首 91%；總筆畫/IDS 拆分 ≈ 84%；
五行、頻率僅 ≈ 11%（屬選擇性加值欄）。

### 2.3 `Phoenics` 欄位字典（注音→羅馬拼音對照表）
411 個注音音節，每列提供同一音節在各系統的拼寫：

| 欄位 | 系統 |
|---|---|
| `MPS1` | 注音符號（ㄅㄆㄇ，**主鍵概念**） |
| `WG` | 威妥瑪拼音 Wade–Giles |
| `MPS2` | 注音第二式 |
| `YALE` | 耶魯拼音 |
| `TY` | 通用拼音 Tongyong |
| `HYPY` | 漢語拼音 Hanyu Pinyin |
| `EFEO` | 法國遠東學院拼音 |
| `LOS` | 德國式拼音（Lessing–Othmer） |
| `GRT1`–`GRT4` | 國語羅馬字（四聲拼法） |
| `IPA` | 國際音標 |

> 這是一份相當完整、罕見的**多系統中文羅馬化對照表**，本身即可獨立成為開放資料。

### 2.4 `C_CZ` 區塊代號對照
`0`=統一表意文字、`1`=擴展A、`2`=擴展B、`3`=擴展C、`4`=擴展D、`5`=擴展E、`6`=擴展F、
`11`=相容表意文字、`12`=相容表意文字增補。（程式內亦有 `C_CZCheck()` 以碼位範圍判定。）

### 2.5 部件 / IDS 拆分機制
- `C_PTA` 使用 Unicode 表意文字描述字元（IDS，U+2FF0–U+2FFF：⿰⿱⿲⿳⿴⿵…）。
- 無法以 Unicode 表示的部件，以實體參照 `&CDP-XXXX;`（莫大康熙/CDP 編碼）表示。
- 程式 `C_CHARTextBox_TextChanged` 會**遞迴**展開 `C_PTA` 成多層樹狀結構（TreeView）。

---

## 3. 現有功能清單

1. **字元瀏覽**：依 `C_ID` 前後移動（±1 / ±100 / 首 / 末）、Slider 跳轉。
2. **進階複合查詢**：可同時套用——康熙部首、漢字部件（康熙部件／標準／自訂／手動輸入 IDS）、
   總筆畫、五行、頻率門檻（簡/繁/通用三選一）、Unicode 字區。結果依筆畫排序。
3. **字元格顯示**：8×8＝64 字／頁，分頁，可依「目前字型是否支援該字」**金色高亮**。
4. **部件遞迴拆分樹**：輸入字 → 依 IDS 逐層拆解為部件樹。
5. **多系統標音**：注音固定顯示，另可加選最多 3 套羅馬化系統，即時換算。
6. **批次輸出**：將篩選結果字集匯出為字串（可設分隔符、可只輸出字型支援者、可全頁或單頁）。
7. **字元進階資料頁**：碼位、區塊、部首、康熙出處與釋義、各讀音。
8. **高度可自訂 UI**：各區字型、字級、標音底色可分別設定（存於 `App.config`）。

---

## 4. 問題與技術債（重建前必讀）

### 4.1 架構
- **純 code-behind、零分層**：UI、資料存取、商業邏輯全糾纏在事件處理器裡，無法單元測試。
- **全域 static 狀態**（`Globals`）：難追蹤、難並行、難維護。
- **強型別 DataSet**：已是死路技術，`CharDataSet.Designer.cs` 達 606 KB 全自動產生。

### 4.2 資料存取與平台
- **Access / Jet/ACE OLEDB**：僅限 Windows，受 32/64 位元驅動相依之苦，已不被微軟主推；不可攜。
- 啟動即把 **88,966 列全載入記憶體**，每次查詢以 LINQ-to-Objects 全集掃描 → 大資料集時 UI 卡頓。
- 字型涵蓋判斷 `IfFontSupported` 為 O(字數 × typeface 數)，每次換頁全部重算，效能差。

### 4.3 正確性
- **標音欄位對應錯亂（明確 bug）**：`CHCTOption.SelectPhoenicsSystem` 與
  `MainWindow.MoveMessageUpdate` 兩處的「系統名稱 → 取用欄位」對照**互不一致且錯標**
  （例：選「威妥瑪拼音」一處取 `HYPY`、另一處取 `WG`）。**以 `Phoenics` 資料表的欄位名為準**，重建時須重做這層對照。
- **全面吞例外**：到處是 `catch (Exception ex) { Console.Write(ex) }`，錯誤靜默消失，難除錯。
- `C_UDEC` 以 double 儲存碼位，潛在精度/比較風險。

### 4.4 i18n / 可攜性
- 介面字串、字型名稱（`新細明體`、`HanaMinB`）、字型路徑（`C:\Windows\Fonts`）全部寫死。
- 無多語系架構。

### 4.5 命名與文件
- 全專案把 **Phonetics 拼成 `Phoenics`**，且已寫入資料表名與程式 → 重建時建議正名為 `phonetics`/`romanization`。
- 欄位縮寫（`C_FQA`、`C_TSR`…）無說明文件。
- 無 README、無授權條款、無測試、無 CI、無版本控制（專案非 git repo）。

### 4.6 倉庫衛生 / 安全
- 已淘汰殘骸：`Button_Click`（power2 測試）、`<已廢棄不用>` 區段、大量註解碼。
- **不該入庫的檔案**：`Char.mdb`（50 MB）、`bin/Debug.rar`（8 MB）、
  `CHCT_TemporaryKey.pfx`（簽章金鑰，**安全疑慮，應移除並輪替**）、
  `CHCT170416.vspx`（效能側錄）、`.vs/`。
- `csproj` 內 `PublishUrl` 含個人路徑（`C:\Users\eviat\Downloads`）。

---

## 5. 發展潛力與定位

### 5.1 為什麼值得做
這份資料把幾類本來分散的資源**整合在同一張表**：
- Unicode 碼位／區塊（可對應 Unihan）
- **康熙字典全文釋義 + 出處**（古典辭書，少有現成可查介面內嵌全文者）
- **IDS 部件拆分**（與 CHISE / 漢字データベース 同類，可做部件檢索）
- 注音 + **8＋系統羅馬化對照（含 IPA、EFEO、Lessing–Othmer、國語羅馬字）**
- 部首/筆畫、**五行（姓名學）**、頻率分級

### 5.2 相對於既有專案的差異化
| 既有 | CHCT 的加值 |
|---|---|
| Unihan / Unicode | 內嵌康熙字典「全文」、五行、現成多系統拼音換算 UI |
| CHISE / IDS 資料 | 與釋義、讀音、頻率、字型涵蓋整合於單一查詢介面 |
| 一般線上字典 | **以部件/IDS、五行、字區、頻率做複合篩選並批次匯出字集**（造字、字型測試、命名、教學素材皆適用） |

### 5.3 目標客群
字型開發者（覆蓋測試與字集挑選）、中文教學、姓名學、書法/文字學研究、輸入法/語料工程。

---

## 6. Web 重建：可行性與建議架構

**可行性：高。** 此程式本質是「資料驅動的查詢／篩選／顯示／匯出」工具，與 Web 技術天作之合；
唯一較重的桌面相依（字型涵蓋判斷）在瀏覽器有更好的替代方案。

### 6.1 建議架構（兩種路線，擇一）

**路線 A — 零後端、純靜態（推薦作為開源起步，GitHub Pages 即可）**
```
SQLite（char.sqlite，由 mdb 遷移） 
   → 以 sql.js / wa-sqlite 在瀏覽器端查詢
前端：React 或 Svelte + TypeScript + Vite
   ├ 字元格 / 篩選面板 / 標音面板 / 拆分樹 皆為元件
   └ 字型涵蓋：CSS Font Loading API 或 Canvas 量測；可內嵌開源字型（HanaMin）
資料同時以 CSV/JSON/SQLite 三種格式發佈為「開放資料」
```
優點：免伺服器、免費託管、易被 fork。缺點：首次需下載資料檔（可分片/壓縮/索引）。

**路線 B — 輕後端 API（資料量再擴張或要做全文檢索時）**
```
資料：PostgreSQL（或 SQLite + Litestream）
後端：Node + Hono/Fastify（TypeScript）或 Python + FastAPI
   └ REST/GraphQL：/chars 查詢、/chars/:cp 明細、/decompose、/romanize
前端：同上
全文檢索（康熙釋義）：Postgres FTS 或 Meilisearch
```

> 建議：**先做路線 A 上線**，資料與 UI 穩定後若有 server 需求再升級 B。前端與資料 schema 兩者皆可沿用。

### 6.2 元件對照（舊 → 新）
| WPF 元件 | Web 對應 |
|---|---|
| `CharBlockPanel`（64 鈕） | `<CharGrid>`，虛擬化分頁 |
| 各 `SearchExpander*` | `<FilterPanel>`（部首/部件/筆畫/五行/頻率/字區） |
| `TrvMenu`（拆分樹） | `<DecompositionTree>`，由 `C_PTA` 遞迴展開（沿用現有遞迴邏輯即可） |
| `Phoenics*` 面板 | `<RomanizationPanel>`，查 `phonetics` 表轉換 |
| `OutputTextBox` | `<ExportPanel>`（複製/下載，分隔符選項） |
| `App.config` 偏好 | `localStorage` |

### 6.3 字型涵蓋判斷（取代 WPF 掃描）
- 瀏覽器端用 Canvas「量測字寬／與 .notdef 比對」或 **Font Loading API + `document.fonts.check()`**。
- 或直接內嵌開源全字庫字型（花園明朝 HanaMin A/B，OFL 授權），讓瀏覽器自行 fallback，再標示哪些字落在 fallback。

---

## 7. 資料遷移計畫（Access → SQLite）

1. **匯出**：以 `mdb-tools`（跨平台）或 ACE OLEDB（Windows）將 6 張表匯成 UTF-8 CSV。
   注意 `C_CMT` 為長文字（memo），匯出需正確處理換行與引號。
2. **正名與型別修正**（建議在遷移腳本一次處理）：
   - 表 `Phoenics` → `romanization`；`CharX` → `characters`；`PartB/K/C` → `components_standard/radical/custom`。
   - `C_UDEC` double → `INTEGER codepoint`；新增 `codepoint_hex` 衍生欄。
   - `N/A` 一律轉成 `NULL`。
   - 欄位重新命名為可讀英文（附對照表，見 §2 即為對照來源）。
3. **正規化（選做但建議）**：
   - 讀音 `C_PH1..C_PH10` → 改為 `readings(char_id, idx, bopomofo)` 一對多表。
   - IDS `C_PTA` 保留原字串欄，另建 `components(char_id, component, ids_op)` 供部件檢索與反查。
4. **建索引**：`codepoint`、`radical_no`、`stroke_total`、`wuxing`、`block`、以及部件反查表；
   康熙釋義建 FTS（路線 B）。
5. **驗證**：列數需對上（characters 88,966；romanization 411；radical 214…），抽樣比對原值。
6. **發佈**：輸出 `char.sqlite` + 分表 CSV/JSON，附 schema 文件與資料來源說明（§8）。

### 7.1 建議目標 schema（SQLite，簡化示意）
```sql
CREATE TABLE characters (
  id            INTEGER PRIMARY KEY,
  char          TEXT NOT NULL,
  codepoint     INTEGER NOT NULL,      -- 原 C_UDEC（修正為整數）
  block         INTEGER,               -- 原 C_CZ
  radical_no    INTEGER,               -- 原 C_RDCN (1..214)
  stroke_total  INTEGER,               -- 原 C_STKT，-1→NULL
  wuxing        INTEGER,               -- 原 C_WX，0..5，-1→NULL
  freq_all      INTEGER,               -- 原 C_FQA（語意待作者確認）
  freq_trad     INTEGER,               -- 原 C_FQT
  freq_simp     INTEGER,               -- 原 C_FQS
  kangxi_loc    TEXT,                  -- 原 C_KXC
  kangxi_text   TEXT,                  -- 原 C_CMT（康熙釋義全文）
  ids           TEXT                   -- 原 C_PTA（IDS 拆分）
);
CREATE TABLE readings (char_id INT, idx INT, bopomofo TEXT);          -- 原 C_PH1..10
CREATE TABLE romanization (                                            -- 原 Phoenics
  bopomofo TEXT PRIMARY KEY, wade_giles TEXT, mps2 TEXT, yale TEXT,
  tongyong TEXT, hanyu_pinyin TEXT, efeo TEXT, lessing_othmer TEXT,
  gr1 TEXT, gr2 TEXT, gr3 TEXT, gr4 TEXT, ipa TEXT
);
CREATE TABLE components_standard (id INT, comp TEXT, stroke INT, freq INT); -- 原 PartB
-- components_radical（PartK，214）、components_custom（PartC）同形
```

---

## 8. 授權與開源注意事項（**上線前務必處理**）

開源此專案前必須釐清各欄位資料來源的授權，這是**最大法務風險**：

| 資料 | 授權研判 | 行動 |
|---|---|---|
| 康熙字典釋義 `C_CMT` | 原典屬公有領域（1716） | 多數可用；若文字取自某數位化專案，附該專案出處 |
| Unicode 衍生（碼位、部首、筆畫、區塊） | Unicode 授權（寬鬆） | 可用，標註來源 Unihan |
| IDS 拆分 `C_PTA` | 視來源（CHISE/Unicode IDS 多為開放） | 確認來源並標註 |
| 注音 / 各系統羅馬化 / 頻率表 | **來源不明，風險最高** | **務必確認**是否抄自受版權字典/語料；不明者重建或替換為開放來源 |
| 花園明朝 HanaMin | SIL OFL | 可隨附，附授權檔與字型出處 |
| 新細明體 PMingLiU | 微軟專有 | **不可隨附**；Web 改用開源字型 |

- **碼庫須移除** `CHCT_TemporaryKey.pfx`（並輪替金鑰）、`Char.mdb`、`bin/`、`*.vspx`、`.vs/`、個人路徑。
- 選定授權：程式碼建議 MIT/Apache-2.0；**資料建議與程式分開授權**（如資料用 CC BY-SA 或 CC0，視來源容許度）。

---

## 9. 分階段路線圖

**Phase 0　資料解放（最高優先）**
- 遷移 mdb → SQLite + CSV/JSON（§7），正名欄位，修正型別與 `N/A`。
- 釐清資料來源與授權（§8），撰寫 `DATA.md` 資料字典與出處。
- 產出：可獨立使用的開放資料集（即使 UI 還沒做，資料已有價值）。

**Phase 1　唯讀 Web MVP（路線 A）**
- 單字查詢頁：字元、碼位、區塊、部首/筆畫、注音與多系統拼音、康熙出處與釋義、IDS 拆分樹。
- 瀏覽器端 SQLite 查詢；基本路由 `/{字}` 或 `/U+XXXX`。

**Phase 2　複合篩選 + 字集匯出**
- 重建篩選面板（部首/部件/筆畫/五行/頻率/字區）與部件反查。
- 字元格虛擬化、字型涵蓋標示、批次匯出（複製/下載、分隔符）。

**Phase 3　加值**
- 康熙釋義全文檢索（FTS）、羅馬化雙向換算工具、部件關聯圖、API（升級路線 B）。
- i18n（繁/簡/英）、無障礙、行動版面。

**Phase 4　社群與資料治理**
- 勘誤回報、資料版本化、貢獻流程、CI（資料驗證 + 前端建置）。

---

## 10. 給 AI 實作者的具體指引

- **不要逐行移植 WPF code-behind。** 只萃取「邏輯規則」：IDS 遞迴拆分、區塊判定（`C_CZCheck`）、
  篩選組合條件（見 `QueryExecute_Click`）、注音聲調剝離（`IsPron`：ˇˋˊ˙）。其餘重寫。
- **以資料表欄位名為語意真相來源**，不要相信 UI 端的標音對應（該處有 bug，見 §4.3）。
- 遷移腳本與目標 schema 先寫測試（列數、抽樣值、外鍵完整性），再寫前端。
- 五行、頻率欄位語意尚未 100% 確定，介面上先標「資料不完整／實驗性」，待作者確認（§11）。
- 提交前掃描並排除敏感/巨大檔案（§4.6、§8）；建立 `.gitignore`。

---

## 11. 待作者確認的開放問題（只有作者知道）

1. `C_FQS/C_FQT/C_FQA` 頻率分級的**確切定義與來源**？數字大小方向？
2. `C_STKO`、`C_RPA`、`C_RPB`、`C_SC`、`C_TT`、`C_TSR` 各代表什麼？
3. 注音、各系統羅馬化、頻率與五行資料的**原始出處**為何（授權關鍵）？
4. `C_PH1..C_PH10` 是否有固定排序語意（主音/又音/讀音/語音）？
5. 是否保有比 2017 更新的資料或編輯紀錄，需一併納入？
6. 開源時，程式碼與資料各希望採用何種授權？

---

## 附錄 A：實測數據摘要（2026-06-19）
```
CharX 88,966 | PartB 500 | PartC 6 | PartK 214 | Phoenics 411 | Version 1
總筆畫已建 75,159 | IDS 拆分 74,868 | 注音(PH1) 88,966 | 康熙釋義 88,966
部首 80,921 | 五行 9,640 | 頻率(FQA>0) 9,467
字區分布 CZ0 20,951 / CZ1 6,592 / CZ2 42,720 / CZ3 4,160 / CZ4 224 /
          CZ5 5,776 / CZ6 7,488 / CZ11 512 / CZ12 543
```

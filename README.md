# HanGlyph · 現代漢字資料工具

十萬級 CJK 漢字的**查詢、部件（IDS）拆分、多系統羅馬拼音、康熙字典釋義全文檢索與字集匯出**工具。

HanGlyph 是 2017 年 CHCT WPF 桌面程式的**完整開源重生**：保留並淨化其最有價值的資產——
一份欄位豐富的字元資料庫——並以「**路線 A**」重建為**純前端、瀏覽器端 SQLite 的靜態 Web 應用**
（無後端、可部署於 GitHub Pages）。

> 評估與設計全貌見 [`AI_IMPLEMENTATION.md`](AI_IMPLEMENTATION.md)；資料字典與來源見 [`DATA.md`](DATA.md)。

---

## ✨ 功能

| 頁面 | 內容 |
|---|---|
| **查字** | 單字明細：碼位/字區、部首、總筆畫、五行、頻率、注音與 **8+ 系統羅馬拼音**（含 IPA）、康熙出處與**釋義全文**、**IDS 部件遞迴拆分樹**（可點擊鑽取） |
| **篩選** | 依康熙部首／總筆畫／五行／字區／**含部件**／頻率門檻複合查詢，結果以虛擬化字元格呈現，可**字型支援高亮**並**批次匯出字集**（分隔符、僅匯出字型支援者、複製/下載） |
| **釋義檢索** | 對康熙字典釋義全文做 **FTS5 全文檢索**，命中片段高亮 |
| **拼音轉換** | 注音 → 多系統羅馬化批次換算 |
| **i18n** | 繁體中文／English 切換；行動裝置響應式版面 |

實機畫面（查「愛」）：字形、五行標籤、八系統拼音、部件拆分樹、康熙釋義全文一頁呈現。

---

## 🚀 快速開始

```bash
# 1) 準備資料庫（擇一）
python data/migrate.py                       # 在有 Access 驅動的 Windows 上由原 mdb 重建
#   或自 GitHub Releases 下載 char.sqlite 置於 data/dist/

# 2) 開發模式
cd web
npm install
npm run dev                                   # http://localhost:5173
```

正式建置與本機驗證：
```bash
cd web
npm run build           # 產出 dist/（含 worker、wasm、char.sqlite）
npm run serve           # 以「正確支援 HTTP Range」的靜態伺服器服務 dist（:4180）
npm run smoke           # 無頭瀏覽器端到端測試（需 npx playwright install chromium）
```

> ⚠ 路線 A 仰賴 **HTTP Range 請求**逐頁載入 42MB 的 SQLite。
> 一般靜態主機（GitHub Pages、Netlify…）原生支援；本機請用 `npm run serve`
> 而非 `vite preview`（後者的 HEAD 不回報 `Accept-Ranges`，會觸發 httpvfs 警告）。

---

## 🏗 架構（路線 A）

```
原始 Char.mdb (Access)
        │  data/migrate.py  （正名 / 修型 / N/A→NULL / 正規化 / FTS5）
        ▼
data/dist/char.sqlite (42MB) ── CSV/JSON 開放資料
        │  npm run setup-data（複製到 web/public/data/）
        ▼
瀏覽器：sql.js-httpvfs（WASM + Web Worker）
        └─ HTTP Range 逐頁查詢，不需後端、不需整檔下載
        ▼
React + TypeScript（Vite）
```

關鍵實作決策：
- **參數綁定**：此版 sql.js-httpvfs 的 `?` 綁定失效，已在 [`web/src/db/client.ts`](web/src/db/client.ts) 改以安全字面量內聯（整數驗證 + 單引號跳脫；唯讀前端無伺服器注入風險）。
- **羅馬化對照**：以 `romanization` 資料表欄位名為準，**修正**原桌面程式中系統名→欄位的對照錯位 bug。
- **字型涵蓋**：以 Canvas 像素比對偵測（目標字型 vs 強制後備），取代 WPF 的 GlyphTypeface 掃描。
- **字型（全黑體、一致）**：BMP（URO/Ext A/相容）用**思源黑體 / Noto Sans CJK**
  （`src: local()` 優先用本機已裝者，否則下載自帶子集），Ext B–J 用 **Plangothic 屏黑**
  （含第 3 平面 G/H/J）；康熙釋義（serif）的罕用字後備用花園明朝 HanaMin。皆 OFL/自由授權，
  以 `unicode-range` 惰性載入、無需開關。取得：`npm run setup-fonts` 與 `npm run setup-noto`
  （見 [`web/PLANGOTHIC.md`](web/PLANGOTHIC.md)、[`web/HANAMIN.md`](web/HANAMIN.md)）。

---

## 📁 目錄結構

```
.
├── AI_IMPLEMENTATION.md   # 全面評估與 Phase 0–4 實作指引
├── DATA.md                # 資料字典與來源/授權（由 migrate.py 產生）
├── data/
│   ├── migrate.py         # Phase 0：mdb → SQLite + CSV/JSON + DATA.md
│   ├── validate.py        # 資料完整性/列數驗證（CI 用）
│   └── dist/              # 產物（gitignore；以 Releases 發佈）
├── web/                   # 路線 A Web 應用（Vite + React + TS）
│   ├── src/db/            # client（httpvfs）/ queries / types
│   ├── src/lib/           # ids（拆分）/ constants / fontCoverage
│   ├── src/components/    # CharDetail / CharGrid / DecompositionTree / RomanizationPanel …
│   ├── src/views/         # Lookup / Filter / Search / Convert / About
│   └── scripts/           # setup-data / serve（Range）/ smoke（E2E）
├── CHCT/                  # 原始 2017 WPF 專案（保留作參考，bin/obj 不進版控）
└── .github/workflows/     # CI（typecheck+build）/ Pages 部署
```

---

## 🔐 安全與授權（散布前必讀）

- **`CHCT/CHCT_TemporaryKey.pfx`** 是原專案遺留的簽章金鑰，已列入 `.gitignore`。
  **公開前請從工作目錄移除並輪替該金鑰。**
- 程式碼採 **MIT**（見 `LICENSE`）。
- **資料另行規範**：康熙釋義原典屬公有領域；Unicode 衍生欄位寬鬆；
  **注音／羅馬化／頻率資料來源尚待確認**——散布前務必釐清，詳見 [`DATA.md`](DATA.md) 與 `AI_IMPLEMENTATION.md` §8、§11。

---

## 🚢 發佈資料與部署

`char.sqlite`（約 44 MiB）與字型不進版控。站台部署於 <https://hanglyph.eviat.me>
（GitHub Pages + 自訂網域；`web/public/CNAME` 與 deploy.yml 的 `VITE_BASE=/` 兩者要一致）。

```bash
# 1) 產生資料與字型子集
python data/migrate.py && python data/ingest_ext.py   # -> data/dist/char.sqlite
cd web && npm run setup-noto                          # -> public/fonts/NotoSansCJKtc-cjkbmp.woff2

# 2) 發佈為 Release data-v1（需先 gh auth login）
npm run publish-data                 # 直接公開發佈；加 -- --draft 則只建草稿
```

部署工作流程 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 會自 `data-v1`
下載 `char.sqlite` 與字型子集。兩者缺少時 build 仍會成功，但站台會分別顯示「資料缺失」
與回退到系統字型——**是靜默降級，不是錯誤**，發佈後請實際開站確認。

> ⚠ **資料發佈是刻意保留給作者親自執行的動作**：散布前請先釐清注音／羅馬化／頻率資料來源
> （見 [`DATA.md`](DATA.md)）。`npm run publish-data` **會直接公開發佈**——之所以不預設草稿，
> 是因為 CI 的 `GITHUB_TOKEN` 讀不到草稿 release，會讓部署靜默建出沒有資料的站台。

## ✅ 進度（Phase 0–4 全數完成）

- **Phase 0** 資料解放：103,017 字遷入乾淨 SQLite，正規化讀音/部件反查、FTS5、CSV/JSON 開放資料、`DATA.md`。
- **Phase 1** 唯讀單字查詢頁。
- **Phase 2** 複合篩選 + 虛擬化字元格 + 字型支援高亮 + 字集匯出。
- **Phase 3** 康熙釋義全文檢索 + 拼音轉換 + i18n + 響應式版面。
- **Phase 4** 倉庫治理：`.gitignore`、CI、Pages 部署、`LICENSE`、`CONTRIBUTING.md`、資料驗證。

端到端煙霧測試（無頭 Chromium）10/10 通過。

## 📜 取用的資料／字型
- 字元/部首/筆畫/碼位：Unicode / Unihan（衍生）。
- 康熙字典釋義：原典公有領域。
- 罕用字字型：花園明朝 HanaMin（源自 GlyphWiki，GlyphWiki 授權，可自由再散布；見 [`web/HANAMIN.md`](web/HANAMIN.md)）。

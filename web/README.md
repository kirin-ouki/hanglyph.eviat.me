# HanGlyph Web（路線 A）

純前端、瀏覽器端 SQLite 的中文字元工具。技術：Vite + React + TypeScript + sql.js-httpvfs。

## 指令
| 指令 | 說明 |
|---|---|
| `npm run dev` | 開發伺服器（:5173），會自動複製 `../data/dist/char.sqlite` 到 `public/data/` |
| `npm run setup-fonts` | 取得花園明朝 HanaMin（補罕用字，~63MB；選用，見 [HANAMIN.md](HANAMIN.md)） |
| `npm run test` | 單元測試（Vitest，純函式） |
| `npm run build` | 產出 `dist/`（含 worker、wasm、資料） |
| `npm run serve` | 以正確支援 HTTP Range 的靜態伺服器服務 `dist/`（:4180） |
| `npm run smoke` | 對 `:4180` 跑無頭瀏覽器端到端測試（先 `npx playwright install chromium`） |
| `npm run typecheck` | TypeScript 檢查 |

## 結構
- `src/db/client.ts` — sql.js-httpvfs 初始化與安全查詢（含參數內聯，見檔內註解）。
- `src/db/queries.ts` — 所有 SQL 集中於此；元件不直接寫 SQL。
- `src/db/types.ts` — 對應 `char.sqlite` 的列型別。
- `src/lib/ids.ts` — IDS 解析與遞迴拆分。
- `src/lib/fontCoverage.ts` — Canvas 像素比對的字型涵蓋偵測。
- `src/lib/constants.ts` — 羅馬化系統對照、五行、聲調處理。
- `src/views/*` — Lookup / Filter / Search / Convert / About。

## 部署
GitHub Pages：見 `../.github/workflows/deploy.yml`。
`char.sqlite` 不進版控（42MB），由名為 `data-v1` 的 Release 提供；
`VITE_BASE` 需設為 `/<repo>/`。

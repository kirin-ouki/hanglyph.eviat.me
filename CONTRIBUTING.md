# 貢獻指引 Contributing

歡迎參與 HanGlyph！本專案分為「資料」與「Web 應用」兩部分。

## 環境需求
- Node.js ≥ 20.19（CI 用 24）、Python ≥ 3.10
- 重建資料庫需 Windows + Microsoft Access 驅動（ACE/Jet）與 `pip install pyodbc`
  （一般前端貢獻者**不需要**，直接取用既有 `char.sqlite` 即可）

## 開始開發
```bash
# 1) 取得資料庫（擇一）
#    a. 重建：在有 Access 驅動的 Windows 上
python data/migrate.py
#    b. 或自 GitHub Releases 下載 char.sqlite 放到 data/dist/

# 2) 啟動前端（會自動把 char.sqlite 複製到 web/public/data/）
cd web
npm install
npm run dev          # http://localhost:5173
```

## 驗證
```bash
python data/validate.py            # 資料完整性與列數
cd web
npm run typecheck                  # TypeScript
npm run build && npm run serve &   # 以正確支援 Range 的伺服器服務 dist
npm run smoke                      # 無頭瀏覽器端到端煙霧測試（需 npx playwright install chromium）
```

## ⚠ 不要刪掉 `@emnapi/core` 與 `@emnapi/runtime`

這兩個套件在原始碼裡沒有任何 import，看起來像是多餘的相依——**它們不是**。

`@tailwindcss/oxide-wasm32-wasi`（Tailwind 原生綁定的 wasm 後備）依賴它們，
但 npm 在 Windows 上產生 lockfile 時不會把這條相依鏈寫進去（npm 的跨平台
optional dependency 老問題）。結果是本機一切正常，Linux 上的 `npm ci` 卻會以
`Missing: @emnapi/core from lock file` 失敗，讓 CI 與 Pages 部署全掛。

顯式宣告為 devDependencies 是強迫它們進入 lockfile 的手段。若哪天改在 Linux
或 WSL 上維護 lockfile，確認 `npm ci` 在 Linux 通過之後才可以移除。

## 程式碼風格
- TypeScript `strict`；元件只透過 `src/db/queries.ts` 存取資料，不要在元件內寫 SQL。
- 所有查詢走 `src/db/client.ts` 的 `query()`（已內建參數安全內聯，見該檔註解）。

## 資料貢獻
- 修正字元資料請描述**來源**（這對授權至關重要，見 `DATA.md`）。
- 欲新增欄位請同步更新 `data/migrate.py`、`DATA.md` 與 `web/src/db/types.ts`。

## 提交
- 從 `main` 開新分支，PR 需通過 CI（typecheck + build + 資料腳本語法檢查）。
- Commit 訊息請簡述「動機」。

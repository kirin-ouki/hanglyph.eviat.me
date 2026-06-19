# 貢獻指引 Contributing

歡迎參與 CHCT！本專案分為「資料」與「Web 應用」兩部分。

## 環境需求
- Node.js ≥ 18、Python ≥ 3.10
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

## 程式碼風格
- TypeScript `strict`；元件只透過 `src/db/queries.ts` 存取資料，不要在元件內寫 SQL。
- 所有查詢走 `src/db/client.ts` 的 `query()`（已內建參數安全內聯，見該檔註解）。

## 資料貢獻
- 修正字元資料請描述**來源**（這對授權至關重要，見 `DATA.md`）。
- 欲新增欄位請同步更新 `data/migrate.py`、`DATA.md` 與 `web/src/db/types.ts`。

## 提交
- 從 `main` 開新分支，PR 需通過 CI（typecheck + build + 資料腳本語法檢查）。
- Commit 訊息請簡述「動機」。

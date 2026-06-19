# CHCT 開放資料 `data-v1`

CHCT 的字元資料集（由 `data/migrate.py` 自 2017 原始 `Char.mdb` 遷移、正規化而成）。
此 Release 提供 Web 應用與一般用途所需的資料檔；前端部署（GitHub Pages）會自此 Release 下載 `char.sqlite`。

## 資產
| 檔案 | 說明 |
|---|---|
| `char.sqlite` | 正規化 SQLite（約 43MB，含 FTS5 全文索引）。Web App 標準來源。 |
| `DATA.md` | 資料字典、欄位對照與來源/授權說明。 |
| `stats.json` | 遷移驗證統計。 |

## 內容規模
- characters：88,966（統一表意文字 + 擴展 A–F + 相容區）
- readings：89,216（一字多音正規化）
- char_components：166,736（IDS 部件反查）
- romanization：411 注音音節 × 8+ 系統（含 IPA、國語羅馬字）
- 康熙釋義、IDS 拆分、部首/筆畫、五行、頻率分級

## ⚠ 授權
- 康熙釋義原典：公有領域。Unicode 衍生欄位：寬鬆。
- **注音／羅馬化／頻率資料來源尚待確認**——再散布前請先釐清（見 `DATA.md`、`AI_IMPLEMENTATION.md` §8、§11）。

## 重現
```bash
pip install pyodbc            # 需 Windows + Access 驅動
python data/migrate.py
python data/validate.py
```

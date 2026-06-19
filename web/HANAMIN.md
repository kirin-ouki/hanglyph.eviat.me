# 花園明朝 HanaMin 字型（罕用字補字）

CHCT 收錄近九萬字，其中大量罕用字（Ext A/B…）系統內建字型常無法顯示（呈現為「豆腐」□）。
本專案以**選用方式**內嵌花園明朝 HanaMin 全覆蓋字型來補齊這些字。

## 取得
字型約 63MB，**不進版控**；需要時執行：
```bash
cd web
npm run setup-fonts          # 下載 HanaMinA.otf + HanaMinB.otf 到 public/fonts/
```
之後於 App 右上勾選「罕用字字型」即可啟用（首次啟用才會下載字型，並依字所在
Unicode 範圍只載入所需檔：Ext B 字才會抓 HanaMinB）。

## 來源與授權
- 來源：[`cjkvi/HanaMinAFDKO`](https://github.com/cjkvi/HanaMinAFDKO)（release 8.030），源自 [GlyphWiki](https://glyphwiki.org)。
- 授權：**GlyphWiki License**（http://glyphwiki.org/license.html）。
  GlyphWiki 的字符與資料可自由使用、修改、再散布（含商用），亦可作為新字型之基礎，
  **無姓名標示之強制要求**（近公有領域）。
- 字型非 CHCT 原創，僅隨附以利顯示；`setup-fonts.mjs` 會在 `public/fonts/LICENSE.txt` 留存出處說明。

## 字檔涵蓋
| 檔案 | 涵蓋範圍 | unicode-range |
|---|---|---|
| HanaMinA.otf | BMP + 擴展A + 相容 | U+3400–4DBF, U+4E00–9FFF, U+F900–FAFF 等 |
| HanaMinB.otf | 擴展B | U+20000–2A6DF |

需要 Ext C–F 全覆蓋者，於 `scripts/setup-fonts.mjs` 的 `FONTS` 增列 `HanaMinExC.otf` 等，
並在 `src/lib/fonts.ts` 補對應 `@font-face` 與 `unicode-range`。

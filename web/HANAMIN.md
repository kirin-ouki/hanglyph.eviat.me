# 花園明朝 HanaMin 字型（康熙釋義 serif 後備）

> 自字型統一為黑體後（BMP→思源黑體、Ext B–J→Plangothic，見 [`PLANGOTHIC.md`](PLANGOTHIC.md)），
> HanaMin 的角色已縮為**康熙字典釋義（明體/serif）的罕用字後備**——釋義正文用 serif，
> 思源黑體（黑體）不適合，故由同為明體的 HanaMin 補釋義中系統缺的罕用字。

CHCT 康熙釋義含大量罕用字，系統內建明體常無法顯示（呈現為「豆腐」□），以花園明朝 HanaMin 補齊。

## 取得
字型約 63MB，**不進版控**；需要時執行：
```bash
cd web
npm run setup-fonts          # 下載 HanaMinA.otf + HanaMinB.otf 到 public/fonts/
```
就緒後無需任何設定：依字所在 Unicode 範圍惰性載入（顯示到 Ext B 字才會抓 HanaMinB），
系統缺的 BMP 罕用字會自動以 HanaMin 補上。

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

## 與 Plangothic 互補
Ext C 起（含第 3 平面 G/H/J）由 Plangothic 屏黑負責，見 [`PLANGOTHIC.md`](PLANGOTHIC.md)。
兩套字型 `unicode-range` 互不重疊、皆惰性自動載入：HanaMin 管 BMP/Ext B（明體），
Plangothic 管 Ext C–J（黑體）。若想改由 HanaMin 涵蓋 Ext C–F，可於 `scripts/setup-fonts.mjs`
增列 `HanaMinExC.otf` 等，並在 `src/lib/fonts.ts` 調整對應 `@font-face` 的 `unicode-range`。

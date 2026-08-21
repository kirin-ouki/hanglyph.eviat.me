# Plangothic 屏黑字型（擴展區補字）

CHCT 的擴展區漢字（Ext C–J）多數系統內建字型無法顯示（呈現「豆腐」□）。
本專案以**選用方式**內嵌 [Plangothic Project（屏黑）](https://github.com/Fitzgerald-Porthmouth-Koenigsegg/Plangothic_Project)
這套以「追上全 Unicode CJK 擴展」為目標的黑體來補齊，**含目前最新、位於第 3 平面的 Ext G/H/J**。

字型分工（皆黑體，視覺一致）：**BMP（URO/Ext A/相容）由思源黑體 / Noto Sans CJK 顯示**
（以 `src: local()` 優先用使用者已安裝者，未裝者下載自帶子集 `NotoSansCJKtc-cjkbmp.woff2`，
約 4.7MB，見 [`scripts/setup-noto.py`](scripts/setup-noto.py)）；**Ext B–J 由 Plangothic 顯示**。
[`HANAMIN.md`](HANAMIN.md) 的花園明朝（明體）則僅作康熙釋義（serif）的罕用字後備。
`@font-face` 一律注入、惰性下載——**毋須任何開關**：僅在畫面真的出現該範圍的字時才下載
對應檔（字型堆疊見 `src/lib/fonts.ts` 的 `FILL_FONT_STACK`）。

## 取得
字型約 32MB（P1 20MB + P2 12MB），**不進版控**；需要時執行：
```bash
cd web
npm run setup-fonts          # 一併下載 HanaMin 與 Plangothic 到 public/fonts/
```
就緒後無需任何設定：顯示到系統缺的字時，瀏覽器會自動下載對應檔並補上字形。

## 來源與授權
- 來源：[`Fitzgerald-Porthmouth-Koenigsegg/Plangothic_Project`](https://github.com/Fitzgerald-Porthmouth-Koenigsegg/Plangothic_Project)（release `V2.9.5792`）。
- 授權：**SIL Open Font License 1.1**。可自由使用、嵌入、再散布；衍生字型須沿用 OFL，
  且**不得單獨販售字型檔本身**。隨附於 `public/fonts/LICENSE.txt`。

## 字檔涵蓋（由 `scripts/inspect-plangothic.py` 實測 cmap 得出）
| 檔案 | 大小 | 主要涵蓋 | 本專案指派的 unicode-range |
|---|---|---|---|
| PlangothicP1-Regular.ttf | ~20MB | 第 2 平面 CJK：Ext B–F、I、相容增補（另零星 BMP）| `U+20000–2EE5F, U+2F800–2FA1F`（Ext B 起）|
| PlangothicP2-Regular.ttf | ~12MB | **第 3 平面 CJK：Ext G/H/J**（13,429 字）| `U+30000–33479` |

> P1 範圍含 Ext B（與 HanaMin B 重疊），是刻意為之：堆疊順序 Plangothic 在前，使 Ext B–J
> 一律以 Plangothic 黑體顯示，避免同一畫面 Ext B 落到 HanaMin 明體、與其他擴展字襯線／非襯線
> 混排。BMP 常用字（URO/Ext A）Plangothic 多未收，仍由系統字型顯示。

> ⚠ **「能顯示」需兩個條件同時成立**：① 字型有該字（上表）；② 作業系統／瀏覽器的文字引擎
> 支援第 3 平面碼位——較舊的環境可能根本不去 Plane 3 取字。請用近期版本的 OS 與瀏覽器。

> ⓘ Ext J 隨 Unicode 17.0（2025-09）才發布，字型生態仍在起步；Plangothic 與 GNU Unifont
> 是目前少數已收錄者。本資料庫的 Ext G/H/I/J 已由 [`../data/ingest_ext.py`](../data/ingest_ext.py)
> 自 Unicode 17.0 Unihan 補入，故在查字／篩選頁即會自動以本字型顯示這些字
> （部首／筆畫齊全，讀音與 IDS 為部分覆蓋，見 [`../data/CATCHUP.md`](../data/CATCHUP.md)）。

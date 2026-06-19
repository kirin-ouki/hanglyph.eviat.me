// 取得花園明朝 HanaMin 字型到 web/public/fonts/（不進版控）。
// 這些字型補齊系統字型常缺的罕用字（Ext A/B…），讓近九萬字盡可能可顯示。
// 來源 cjkvi/HanaMinAFDKO（源自 GlyphWiki，採 GlyphWiki 授權：可自由使用/再散布/
// 作字型基礎，含商用，無姓名標示限制）。詳見 web/HANAMIN.md。
// 預設只抓 A（BMP+ExtA）與 B（ExtB）；如需 Ext C–I 自行於 FONTS 增列。
import { existsSync, mkdirSync, createWriteStream, statSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const TAG = process.env.HANAMIN_TAG || "8.030";
const BASE = `https://github.com/cjkvi/HanaMinAFDKO/releases/download/${TAG}`;
const FONTS = ["HanaMinA.otf", "HanaMinB.otf"]; // 可加 "HanaMinExC.otf" 等

const NOTICE = `花園明朝 HanaMin（Hanazono Mincho）
來源：https://github.com/cjkvi/HanaMinAFDKO （release ${TAG}，源自 GlyphWiki）
授權：GlyphWiki License — http://glyphwiki.org/license.html
      GlyphWiki 的字符與資料可自由使用、修改、再散布（含商用），
      亦可作為新字型之基礎，無姓名標示之強制要求。
本檔由 web/scripts/setup-fonts.mjs 取得，非 CHCT 原創，僅隨附以利顯示罕用字。
`;

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../public/fonts");
mkdirSync(outDir, { recursive: true });

async function download(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 0) {
    console.log(`[fonts] 已存在，略過 ${dest}`);
    return;
  }
  process.stdout.write(`[fonts] 下載 ${url} … `);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  console.log(`${(statSync(dest).size / 1e6).toFixed(1)} MB`);
}

try {
  for (const f of FONTS) await download(`${BASE}/${f}`, resolve(outDir, f));
  writeFileSync(resolve(outDir, "LICENSE.txt"), NOTICE, "utf-8");
  console.log("[fonts] 完成。HanaMin 已就緒，於 App 開啟「罕用字字型」即可使用。");
} catch (e) {
  console.error("[fonts] 失敗：", e.message);
  console.error("        可改用鏡像或手動下載 HanaMinA.otf / HanaMinB.otf 放入 web/public/fonts/。");
  process.exit(1);
}

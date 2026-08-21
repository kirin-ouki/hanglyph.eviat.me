// 取得補字字型到 web/public/fonts/（不進版控），補齊系統字型常缺的罕用字，
// 讓全部 CJK 擴展字盡可能可顯示。詳見 web/HANAMIN.md 與 web/PLANGOTHIC.md。
//   HanaMin（花園明朝，明體）  ─ BMP 罕用字（URO/Ext A/相容）＋ Ext B。
//     來源 cjkvi/HanaMinAFDKO（源自 GlyphWiki，GlyphWiki 授權，含商用、無姓名標示限制）。
//   Plangothic（屏黑，黑體）    ─ Ext C–J，含第 3 平面 G/H/J（系統字型幾乎全缺）。
//     來源 Plangothic Project（OFL-1.1）。分檔覆蓋見 web/scripts/inspect-plangothic.py。
import { existsSync, mkdirSync, createWriteStream, statSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const HANAMIN_TAG = process.env.HANAMIN_TAG || "8.030";
const PLANGOTHIC_TAG = process.env.PLANGOTHIC_TAG || "V2.9.5792";
const HANAMIN_BASE = `https://github.com/cjkvi/HanaMinAFDKO/releases/download/${HANAMIN_TAG}`;
const PLANGOTHIC_BASE = `https://github.com/Fitzgerald-Porthmouth-Koenigsegg/Plangothic_Project/releases/download/${PLANGOTHIC_TAG}`;

// [檔名, 下載網址]。HanaMin 可加 "HanaMinExC.otf" 等；Plangothic P1/P2 缺一不可。
const FONTS = [
  ["HanaMinA.otf", `${HANAMIN_BASE}/HanaMinA.otf`],
  ["HanaMinB.otf", `${HANAMIN_BASE}/HanaMinB.otf`],
  ["PlangothicP1-Regular.ttf", `${PLANGOTHIC_BASE}/PlangothicP1-Regular.ttf`],
  ["PlangothicP2-Regular.ttf", `${PLANGOTHIC_BASE}/PlangothicP2-Regular.ttf`],
];

const NOTICE = `本目錄字型由 web/scripts/setup-fonts.mjs 取得，非 CHCT 原創，僅隨附以利顯示罕用字。

花園明朝 HanaMin（Hanazono Mincho）
  來源：https://github.com/cjkvi/HanaMinAFDKO （release ${HANAMIN_TAG}，源自 GlyphWiki）
  授權：GlyphWiki License — http://glyphwiki.org/license.html
        可自由使用、修改、再散布（含商用），亦可作為新字型之基礎，無姓名標示之強制要求。

Plangothic 屏黑（Plangothic Project）
  來源：https://github.com/Fitzgerald-Porthmouth-Koenigsegg/Plangothic_Project （release ${PLANGOTHIC_TAG}）
  授權：SIL Open Font License 1.1 — https://openfontlicense.org
        可自由使用、嵌入、再散布；衍生字型須沿用 OFL，且不得單獨販售字型檔本身。
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
  for (const [name, url] of FONTS) await download(url, resolve(outDir, name));
  writeFileSync(resolve(outDir, "LICENSE.txt"), NOTICE, "utf-8");
  console.log("[fonts] 完成。HanaMin＋Plangothic 已就緒。");
  console.log("[fonts] 另建議執行 `npm run setup-noto` 產生思源黑體 BMP 子集（BMP 顯示一致用，"
              + "未安裝思源黑體的訪客才下載；需 Python + fonttools + brotli）。");
} catch (e) {
  console.error("[fonts] 失敗：", e.message);
  console.error("        可改用鏡像或手動下載對應檔放入 web/public/fonts/（檔名見上方 FONTS）。");
  process.exit(1);
}

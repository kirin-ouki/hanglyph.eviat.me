// 將 Phase 0 產出的 char.sqlite 複製到 web/public/data/（dev 與 build 前自動執行）。
// 資料檔不進版控（見 web/.gitignore）；若不存在請先執行 `python data/migrate.py`。
import { existsSync, mkdirSync, copyFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.CHCT_SKIP_SETUP_DATA) {
  console.log("[setup-data] CHCT_SKIP_SETUP_DATA 已設定，略過（資料應已就位）。");
  process.exit(0);
}

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../data/dist/char.sqlite");
const destDir = resolve(here, "../public/data");
const dest = resolve(destDir, "char.sqlite");

if (!existsSync(src)) {
  console.warn(
    "\n[setup-data] 找不到 " + src +
    "\n            請先在專案根目錄執行：python data/migrate.py\n"
  );
  process.exit(0); // 不阻斷；App 會顯示資料缺失提示
}
mkdirSync(destDir, { recursive: true });
const needCopy = !existsSync(dest) || statSync(dest).mtimeMs < statSync(src).mtimeMs;
if (needCopy) {
  copyFileSync(src, dest);
  console.log(`[setup-data] 已複製 char.sqlite (${(statSync(dest).size / 1e6).toFixed(1)} MB) -> public/data/`);
} else {
  console.log("[setup-data] char.sqlite 已是最新。");
}

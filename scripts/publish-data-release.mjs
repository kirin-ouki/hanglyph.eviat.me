// 一鍵把 char.sqlite 等開放資料發佈為 GitHub Release `data-v1`。
// 前置：1) 已安裝並登入 GitHub CLI（gh auth login）；2) 本倉庫已有 GitHub 遠端。
// 用法：node scripts/publish-data-release.mjs [--draft]
//   預設「直接發佈」。deploy.yml 用的是 CI 的 GITHUB_TOKEN，對草稿 release 的
//   讀取權限不可靠，草稿會讓部署靜默建出沒有資料的站台，所以草稿改為需明確指定。
import { execSync, execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TAG = "data-v1";
const draft = process.argv.includes("--draft");

function must(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    throw new Error(`執行失敗：${cmd} ${args.join(" ")}\n${e.stderr || e.message}`);
  }
}

const mib = (p) => (statSync(p).size / 1024 / 1024).toFixed(1) + " MiB";

// 1) 前置檢查
try {
  execSync("gh --version", { stdio: "ignore" });
} catch {
  console.error("✗ 找不到 GitHub CLI（gh）。請先安裝：https://cli.github.com/ 並執行 gh auth login");
  process.exit(1);
}
try {
  execSync("gh auth status", { stdio: "ignore" });
} catch {
  console.error("✗ gh 尚未登入。請先執行：gh auth login");
  process.exit(1);
}

// 2) 資產。deploy.yml 會自這個 Release 下載 char.sqlite 與思源黑體子集，
//    兩者少了任何一個，站台都還是會建置成功、只是功能靜默降級，所以在這裡明說。
const REQUIRED = [
  ["data/dist/char.sqlite", "資料本體。缺少時站台會顯示「資料缺失」。"],
  ["web/public/fonts/NotoSansCJKtc-cjkbmp.woff2",
   "思源黑體 BMP 子集。缺少時站台會回退到系統字型（跑 `npm run setup-noto` 產生）。"],
];
const OPTIONAL = ["DATA.md", "data/dist/stats.json"];

const assets = [];
let fatal = false;
for (const [rel, why] of REQUIRED) {
  const p = resolve(root, rel);
  if (existsSync(p)) {
    assets.push(p);
  } else if (rel.endsWith("char.sqlite")) {
    console.error(`✗ 找不到 ${rel}——${why}\n  請先執行：python data/migrate.py`);
    fatal = true;
  } else {
    console.warn(`⚠ 找不到 ${rel}——${why}\n  仍會繼續發佈，但部署後請記得補上。`);
  }
}
if (fatal) process.exit(1);
for (const rel of OPTIONAL) {
  const p = resolve(root, rel);
  if (existsSync(p)) assets.push(p);
}

console.log(`將發佈 ${assets.length} 個資產到 ${TAG}${draft ? "（草稿）" : ""}：`);
for (const p of assets) console.log(`  ${basename(p).padEnd(34)} ${mib(p)}`);
if (!draft) {
  console.log("\n⚠ 這是公開發佈：Release 一旦建立，任何人都能下載這些檔案。");
  console.log("  注音／羅馬化／頻率資料的來源與授權尚未釐清，見 DATA.md。\n");
}

// 3) 建立或更新 Release
const notes = resolve(root, "RELEASE_NOTES_data-v1.md");
const exists = (() => {
  try {
    must("gh", ["release", "view", TAG]);
    return true;
  } catch {
    return false;
  }
})();

if (exists) {
  console.log(`Release ${TAG} 已存在 → 更新資產…`);
  must("gh", ["release", "upload", TAG, ...assets, "--clobber"]);
} else {
  console.log(`建立 ${draft ? "草稿" : "公開"} Release ${TAG} …`);
  const args = ["release", "create", TAG, ...assets,
    "--title", "HanGlyph 開放資料 data-v1", "--notes-file", notes];
  if (draft) args.push("--draft");
  must("gh", args);
}
console.log(`✓ 完成。${draft ? "（草稿，需到 GitHub 上按 Publish，否則 CI 抓不到）" : ""}`);
console.log("  部署工作流程 .github/workflows/deploy.yml 會自此 Release 下載資料與字型。");

// 一鍵把 char.sqlite 等開放資料發佈為 GitHub Release「草稿」`data-v1`。
// 前置：1) 已安裝並登入 GitHub CLI（gh auth login）；2) 本倉庫已有 GitHub 遠端。
// 用法：node scripts/publish-data-release.mjs [--publish]
//   預設建立「草稿」（--draft）；加 --publish 則直接公開發佈。
import { execSync, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TAG = "data-v1";
const draft = !process.argv.includes("--publish");

function must(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    throw new Error(`執行失敗：${cmd} ${args.join(" ")}\n${e.stderr || e.message}`);
  }
}

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

// 2) 必要資產
const assets = [
  resolve(root, "data/dist/char.sqlite"),
  resolve(root, "DATA.md"),
  resolve(root, "data/dist/stats.json"),
].filter((p) => existsSync(p));
if (!assets.some((p) => p.endsWith("char.sqlite"))) {
  console.error("✗ 找不到 data/dist/char.sqlite，請先執行：python data/migrate.py");
  process.exit(1);
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
    "--title", "CHCT 開放資料 data-v1", "--notes-file", notes];
  if (draft) args.push("--draft");
  must("gh", args);
}
console.log(`✓ 完成。${draft ? "（草稿，需到 GitHub 上按 Publish）" : ""}`);
console.log("  部署工作流程 .github/workflows/deploy.yml 會自此 Release 下載 char.sqlite。");

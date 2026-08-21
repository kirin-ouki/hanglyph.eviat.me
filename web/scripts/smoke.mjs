// 端到端煙霧測試：以無頭 Chromium 驗證 worker→wasm→範圍抓取→SQL→React 全鏈路。
// 用法：先 `npm run build` 並啟動 `vite preview`，再 `node scripts/smoke.mjs [baseURL]`
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://localhost:4173";
const results = [];
const ok = (n, cond, extra = "") => {
  results.push({ n, pass: !!cond, extra });
  console.log(`${cond ? "PASS" : "FAIL"}  ${n}${extra ? "  — " + extra : ""}`);
};

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

try {
  // ---- Phase 1：單字查詢 ----
  await page.goto(`${BASE}/#/lookup/${encodeURIComponent("愛")}`, { waitUntil: "load" });
  await page.waitForSelector(".glyph", { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector(".glyph")?.textContent?.includes("愛"), null, {
    timeout: 30000,
  });
  ok("glyph 顯示「愛」", (await page.textContent(".glyph"))?.includes("愛"));

  const cp = await page.textContent(".glyph-cp");
  ok("碼位 U+611B", cp?.includes("U+611B"), cp ?? "");

  await page.waitForSelector(".kangxi", { timeout: 15000 });
  const kx = (await page.textContent(".kangxi")) ?? "";
  ok("康熙釋義載入", kx.length > 20, `${kx.length} 字`);
  const kangxiFont = await page.$eval(".kangxi", (el) => getComputedStyle(el).fontFamily);
  ok(
    "康熙釋義使用黑體補字堆疊",
    kangxiFont.includes("Source Han Sans") ||
      kangxiFont.includes("Noto Sans CJK") ||
      kangxiFont.includes("Plangothic"),
    kangxiFont,
  );

  await page.click(".theme-toggle button:nth-child(2)");
  ok("深色模式 class", await page.evaluate(() => document.documentElement.classList.contains("dark")));
  await page.click(".theme-toggle button:nth-child(1)");
  ok("淺色模式 class", await page.evaluate(() => !document.documentElement.classList.contains("dark")));

  await page.waitForFunction(
    () => Array.from(document.querySelectorAll(".rom-table .val")).some((e) => {
      const text = e.textContent?.trim();
      return text && text !== "—";
    }),
    null,
    { timeout: 15000 },
  );
  const romVals = await page.$$eval(".rom-table .val", (els) => els.map((e) => e.textContent));
  ok("多系統拼音有值", romVals.some((v) => v && v !== "—"), romVals.slice(0, 4).join(" "));

  await page.waitForFunction(() => document.querySelectorAll(".tree .t").length >= 2, null, {
    timeout: 15000,
  });
  const treeNodes = await page.$$eval(".tree .t", (els) => els.map((e) => e.textContent));
  ok("部件拆分樹", treeNodes.length >= 2, treeNodes.join(" "));

  // ---- 部件導覽（點樹節點）----
  await page.goto(`${BASE}/#/lookup/${encodeURIComponent("字")}`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector(".glyph")?.textContent === "字", null, {
    timeout: 20000,
  });
  ok("導覽至「字」", (await page.textContent(".glyph")) === "字");

  // ---- Phase 2：篩選 + 字元格 ----
  await page.goto(`${BASE}/#/filter`, { waitUntil: "load" });
  await page.waitForSelector('[data-radical-id="85"]', { timeout: 20000 });
  await page.click('[data-radical-id="85"]');
  await page.waitForFunction(
    () => document.querySelector('[data-radical-id="85"]')?.classList.contains("active"),
    null,
    { timeout: 10000 },
  );
  await page.click('[data-radical-id="85"]');
  await page.waitForFunction(
    () => !document.querySelector('[data-radical-id="85"]')?.classList.contains("active"),
    null,
    { timeout: 10000 },
  );
  await page.click('[data-component="氵"]');
  await page.waitForFunction(
    () => document.querySelector('[data-component="氵"]')?.classList.contains("active"),
    null,
    { timeout: 10000 },
  );
  await page.click('[data-component="口"]');
  await page.waitForFunction(
    () =>
      document.querySelector('[data-component="氵"]')?.classList.contains("active") &&
      document.querySelector('[data-component="口"]')?.classList.contains("active"),
    null,
    { timeout: 10000 },
  );
  await page.waitForSelector(".cell", { timeout: 20000 });
  const cellCount = await page.$$eval(".cell", (els) => els.length);
  const countText = (await page.textContent(".count")) ?? "";
  ok("篩選部件多選即時更新", cellCount > 0, `${countText.trim()} / 可視 ${cellCount} 格`);

  // ---- Phase 3：釋義全文檢索 ----
  await page.goto(`${BASE}/#/search`, { waitUntil: "load" });
  await page.waitForSelector(".searchbar input", { timeout: 20000 });
  await page.fill(".searchbar input", "說文");
  await page.click("button.btn");
  await page.waitForSelector(".hit", { timeout: 20000 });
  const hits = await page.$$eval(".hit", (els) => els.length);
  ok("全文檢索「說文」有結果", hits > 0, `${hits} 筆`);

  // ---- Phase 3：拼音轉換 ----
  await page.goto(`${BASE}/#/convert`, { waitUntil: "load" });
  await page.waitForSelector("textarea", { timeout: 20000 });
  await page.fill("textarea", "ㄞˋ");
  await page.click("button.btn");
  await page.waitForSelector(".rom-table .val", { timeout: 20000 });
  const convVals = await page.$$eval(".rom-table .val", (els) => els.map((e) => e.textContent));
  ok("注音→拼音轉換", convVals.some((v) => v && v !== "—"), convVals.slice(0, 5).join(" "));

  ok("無主控台錯誤", errors.length === 0, errors.slice(0, 3).join(" | "));
} catch (e) {
  ok("執行例外", false, String(e).slice(0, 200));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\n總計 ${results.length} 項，失敗 ${failed} 項。`);
process.exit(failed ? 1 : 0);

import { useEffect, useMemo, useState } from "react";
import { getBlockCoverage, getMeta, type BlockCoverage } from "../db/queries";
import { CJK_BLOCKS, cjkBlockCapacity, toHex } from "../lib/constants";
import { useI18n } from "../i18n";

export function BlocksView() {
  const { t, lang } = useI18n();
  const [cov, setCov] = useState<BlockCoverage[] | null>(null);
  const [meta, setMeta] = useState<Record<string, string>>({});

  useEffect(() => {
    getBlockCoverage().then(setCov);
    getMeta().then(setMeta);
  }, []);

  // block id → 實際收錄
  const byId = useMemo(() => {
    const m = new Map<number, BlockCoverage>();
    for (const r of cov ?? []) if (r.block != null) m.set(r.block, r);
    return m;
  }, [cov]);

  const fmt = (n: number) => n.toLocaleString();

  const totals = useMemo(() => {
    let capacity = 0; // 已涵蓋區塊的碼位容量
    let collected = 0; // 本系統實收
    let assigned = 0; // 已涵蓋區塊的官方指派字數
    let capacityAll = 0; // 全部 13 區塊的碼位容量（理論最大）
    let assignedAll = 0; // 全部 13 區塊的官方指派字數
    for (const b of CJK_BLOCKS) {
      const cap = cjkBlockCapacity(b);
      capacityAll += cap;
      assignedAll += b.assigned;
      if (!b.inSystem) continue;
      capacity += cap;
      assigned += b.assigned;
      collected += byId.get(b.id as number)?.count ?? 0;
    }
    return { capacity, collected, assigned, capacityAll, assignedAll };
  }, [byId]);

  const coveredBlocks = CJK_BLOCKS.filter((b) => b.inSystem).length;
  const hasUncovered = coveredBlocks < CJK_BLOCKS.length;
  // 已涵蓋區塊「內」的完整度（分母只算這 9 區塊）。
  const withinPct = totals.capacity ? (totals.collected / totals.capacity) * 100 : 0;
  // 對「全部 CJK」的涵蓋率（分母含尚未收錄的 G/H/I/J，才是誠實的整體數）。
  const universePct = totals.capacityAll ? (totals.collected / totals.capacityAll) * 100 : 0;

  if (!cov) {
    return (
      <div className="center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="panel card">
      <h2 style={{ marginTop: 0 }}>{t("blocks_title")}</h2>
      <p className="muted" style={{ marginTop: -6, lineHeight: 1.7 }}>
        {lang === "zh"
          ? "涵蓋所有 13 個 Unicode CJK 表意文字區塊（基本區、擴展 A–J、相容區），對照官方指派字數與本系統實際收錄。基底字庫源自 2017 年；擴展 G/H/I/J 已自 Unicode 17.0 Unihan 補入（部首／筆畫齊全，讀音為 kMandarin 所及之處）。"
          : "All 13 Unicode CJK ideograph blocks (basic, Ext A–J, compatibility), comparing the official assigned count with what this dataset holds. The base set is from 2017; Ext G/H/I/J have been ingested from Unicode 17.0 Unihan (full radical/strokes; readings where kMandarin provides them)."}
      </p>

      <div className="blocks-summary">
        <div className="stat">
          <div className="k">{t("blocks_stat_collected")}</div>
          <div className="v">{fmt(totals.collected)}</div>
          <div className="sub">/ {fmt(totals.capacityAll)} {lang === "zh" ? "全部碼位" : "all codepoints"}</div>
        </div>
        <div className="stat">
          <div className="k">{t("blocks_stat_blocks")}</div>
          <div className="v">
            {coveredBlocks}
            <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}> / {CJK_BLOCKS.length}</span>
          </div>
        </div>
        <div className="stat accent">
          <div className="k">{t("blocks_stat_universe")}</div>
          <div className="v">{universePct.toFixed(2)}%</div>
          <div className="sub">
            {hasUncovered
              ? (lang === "zh" ? `含未收錄 ${CJK_BLOCKS.length - coveredBlocks} 區塊` : `incl. ${CJK_BLOCKS.length - coveredBlocks} missing blocks`)
              : (lang === "zh" ? `對全部 ${CJK_BLOCKS.length} 區塊碼位` : `vs all ${CJK_BLOCKS.length} blocks`)}
          </div>
        </div>
        {hasUncovered && (
          <div className="stat">
            <div className="k">{t("blocks_stat_within")}</div>
            <div className="v">{withinPct.toFixed(2)}%</div>
            <div className="sub">{lang === "zh" ? `僅這 ${coveredBlocks} 區塊` : `these ${coveredBlocks} blocks only`}</div>
          </div>
        )}
      </div>

      <table className="blocks-table">
        <thead>
          <tr>
            <th>{t("blocks_col_block")}</th>
            <th>{t("blocks_col_range")}</th>
            <th className="num">{t("blocks_col_assigned")}</th>
            <th className="num">{t("blocks_col_capacity")}</th>
            <th className="num">{t("blocks_col_collected")}</th>
            <th className="cov-cell">{t("blocks_col_coverage")}</th>
          </tr>
        </thead>
        <tbody>
          {CJK_BLOCKS.map((b) => {
            const capacity = cjkBlockCapacity(b);
            const row = b.id != null ? byId.get(b.id) : undefined;
            const count = row?.count ?? 0;
            const pct = capacity ? (count / capacity) * 100 : 0;
            const full = b.inSystem && pct >= 99.999;
            const ver = b.lastVer === b.firstVer ? `U${b.firstVer}` : `U${b.firstVer}→${b.lastVer}`;
            return (
              <tr key={`${b.abbr}-${b.start}`} className={b.inSystem ? "" : "uncovered"}>
                <td>
                  <span className="b-name">{lang === "zh" ? b.zh : b.en}</span>
                  <span className="b-abbr">{b.abbr} · {ver}</span>
                </td>
                <td className="b-range">
                  {toHex(b.start)}–{toHex(b.end)}
                </td>
                <td className="num">{fmt(b.assigned)}</td>
                <td className="num cap">{fmt(capacity)}</td>
                <td className="num">
                  {b.inSystem ? fmt(count) : <span className="muted">—</span>}
                </td>
                <td className="cov-cell">
                  {b.inSystem ? (
                    <>
                      <div className="cov-bar">
                        <div
                          className={"cov-fill" + (full ? " full" : "")}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="cov-pct">
                        {pct.toFixed(pct === 100 ? 0 : pct >= 99.99 ? 2 : 1)}%
                      </span>
                    </>
                  ) : (
                    <span className="cov-pct">{t("blocks_uncovered")}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {hasUncovered && (
            <tr>
              <td>
                {t("blocks_total")}
                <span className="b-abbr">{lang === "zh" ? `已涵蓋 ${coveredBlocks} 區塊` : `${coveredBlocks} covered blocks`}</span>
              </td>
              <td className="b-range muted">—</td>
              <td className="num">{fmt(totals.assigned)}</td>
              <td className="num cap">{fmt(totals.capacity)}</td>
              <td className="num">{fmt(totals.collected)}</td>
              <td className="cov-cell">
                <span className="cov-pct">{withinPct.toFixed(2)}%</span>
              </td>
            </tr>
          )}
          <tr className="grand">
            <td>
              {hasUncovered ? t("blocks_all_blocks") : t("blocks_total")}
              <span className="b-abbr">{hasUncovered ? t("blocks_theoretical") : t("blocks_all_blocks")}</span>
            </td>
            <td className="b-range muted">—</td>
            <td className="num">{fmt(totals.assignedAll)}</td>
            <td className="num cap">{fmt(totals.capacityAll)}</td>
            <td className="num">{fmt(totals.collected)}</td>
            <td className="cov-cell">
              <div className="cov-bar">
                <div className="cov-fill" style={{ width: `${Math.min(universePct, 100)}%` }} />
              </div>
              <span className="cov-pct">{universePct.toFixed(2)}%</span>
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="blocks-note">
        <h3>{t("blocks_scattered_h")}</h3>
        {lang === "zh" ? (
          <p>
            各區塊的漢字並非一次到位，而是歷年於既有範圍內「零碎追加」：基本區自 1993 年的
            20,902 字起，陸續在 U+9FA6 之後補入（U+9FBB、U+9FCC、U+9FEF、U+9FFF…），逐步填滿
            U+4E00–U+9FFF；<b>擴展 C 區更遲至 Unicode 17.0（2025）才由 U+2B73A–U+2B73F 等 6 字補滿</b>，
            擴展 E 區尾端亦補入 12 字。這些「當初不屬於任何擴展、後來才補進去」的碼位，都落在各自
            區塊範圍內，已計入上表的「區段碼位」；本系統當年採逐區段列舉，故多數槽位早已備妥
            （所缺者為基本區 41、相容增補 1 等少數尾端碼位）。
          </p>
        ) : (
          <p>
            Characters were not assigned to each block all at once but trickled in over the years within the
            existing ranges. The basic block grew from 20,902 (1993), with code points added after U+9FA6
            (U+9FBB, U+9FCC, U+9FEF, U+9FFF…) gradually filling U+4E00–U+9FFF;{" "}
            <b>Extension C was only completed in Unicode 17.0 (2025) by 6 characters at U+2B73A–U+2B73F</b>, and
            Extension E gained 12 more at its tail. These piecemeal code points — not part of any extension
            originally — all fall within their blocks' ranges and are counted in the “Codepoints” column above.
            This dataset enumerated whole ranges, so most slots were already in place (the few missing are tail
            code points: 41 in the basic block, 1 in Compatibility Supplement, etc.).
          </p>
        )}
        <p className="muted">
          {lang === "zh"
            ? "相容表意文字多為既有字的「相容重複」碼位；本表將相容區整塊計入，故 13 區合計為 102,998 字。若依 Unicode 標準僅計 12 個獨立相容字，CJK 統一表意文字的標準總數為 101,996。"
            : "Most compatibility ideographs are compatibility duplicates of existing characters; this table counts the compatibility blocks in full, so the 13-block total is 102,998. Counting only the 12 unique compatibility ideographs (per the Unicode standard) gives the canonical CJK ideograph total of 101,996."}
        </p>
        <p className="muted src">
          {lang === "zh"
            ? "「Unicode 收字」為 Unicode 17.0（2025）各區實際指派字數，取自中文維基百科「中日韓統一表意文字」版本沿革；「區段碼位」為碼位範圍大小（含保留碼位）。"
            : "“Assigned” reflects characters assigned as of Unicode 17.0 (2025) per the version history in the Chinese Wikipedia article; “Codepoints” is the code-point range size (including reserved points)."}
          {meta.generated_at && (
            <>
              {" · "}
              {lang === "zh" ? "資料集" : "dataset"} {meta.generated_at}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

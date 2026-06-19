import { useEffect, useMemo, useState } from "react";
import { I18nContext, useI18n, type Lang } from "./i18n";
import { query } from "./db/client";
import { setHanaMinEnabled } from "./lib/fonts";
import { LookupView } from "./views/LookupView";
import { FilterView } from "./views/FilterView";
import { SearchView } from "./views/SearchView";
import { ConvertView } from "./views/ConvertView";
import { AboutView } from "./views/AboutView";

type View = "lookup" | "filter" | "search" | "convert" | "about";
const VIEWS: View[] = ["lookup", "filter", "search", "convert", "about"];

function parseHash(): { view: View; query: string } {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const [v, ...rest] = h.split("/");
  const view = (VIEWS as string[]).includes(v) ? (v as View) : "lookup";
  return { view, query: rest.join("/") };
}

export function App() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("chct.lang") as Lang) || "zh");
  useEffect(() => {
    localStorage.setItem("chct.lang", lang);
    document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";
  }, [lang]);

  const ctx = useMemo(() => ({ lang, setLang }), [lang]);
  return (
    <I18nContext.Provider value={ctx}>
      <Shell />
    </I18nContext.Provider>
  );
}

function Shell() {
  const { t, lang, setLang } = useI18n();
  const [db, setDb] = useState<"loading" | "ready" | "missing">("loading");
  const [route, setRoute] = useState(parseHash);
  const [hanamin, setHanamin] = useState(() => localStorage.getItem("chct.hanamin") === "1");

  function toggleHanamin(on: boolean) {
    setHanamin(on);
    localStorage.setItem("chct.hanamin", on ? "1" : "0");
    setHanaMinEnabled(on);
  }

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    query<{ value: string }>("SELECT value FROM meta WHERE key = 'schema_version'")
      .then(() => setDb("ready"))
      .catch((e) => {
        console.error(e);
        setDb("missing");
      });
  }, []);

  function go(view: View, q = "") {
    location.hash = `#/${view}${q ? "/" + encodeURIComponent(q) : ""}`;
    setRoute({ view, query: q });
  }

  return (
    <div className="app">
      <header className="header">
        <span className="brand">CHCT<span className="dot">·</span></span>
        <span className="tagline">{t("tagline")}</span>
        <label className="hanamin-toggle" title={t("hanamin_title")} style={{ marginLeft: "auto" }}>
          <input type="checkbox" checked={hanamin} onChange={(e) => toggleHanamin(e.target.checked)} />
          {t("hanamin_label")}
        </label>
        <div className="langtoggle">
          <button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中</button>
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
      </header>

      <nav className="nav">
        {VIEWS.map((v) => (
          <button key={v} className={route.view === v ? "active" : ""} onClick={() => go(v)}>
            {t(`nav_${v}`)}
          </button>
        ))}
      </nav>

      {db === "loading" && (
        <div className="center">
          <div className="spinner" />
          <div>{t("loading_db")}</div>
        </div>
      )}
      {db === "missing" && <div className="center err">{t("db_missing")}</div>}

      {db === "ready" && (
        <main>
          {route.view === "lookup" && (
            <LookupView initial={route.query} onQueryChange={(q) => go("lookup", q)} />
          )}
          {route.view === "filter" && <FilterView onOpenChar={(c) => go("lookup", c)} />}
          {route.view === "search" && <SearchView onOpenChar={(c) => go("lookup", c)} />}
          {route.view === "convert" && <ConvertView />}
          {route.view === "about" && <AboutView />}
        </main>
      )}
    </div>
  );
}

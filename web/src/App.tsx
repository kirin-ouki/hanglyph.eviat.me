import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { I18nContext, useI18n, type Lang } from "./i18n";
import { query } from "./db/client";
import { LookupView } from "./views/LookupView";
import { FilterView } from "./views/FilterView";
import { SearchView } from "./views/SearchView";
import { ConvertView } from "./views/ConvertView";
import { BlocksView } from "./views/BlocksView";
import { AboutView } from "./views/AboutView";

type View = "lookup" | "filter" | "search" | "convert" | "blocks" | "about";
const VIEWS: View[] = ["lookup", "filter", "search", "convert", "blocks", "about"];
type Theme = "light" | "dark";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseHash(): { view: View; query: string } {
  const h = safeDecode(location.hash.replace(/^#\/?/, ""));
  const [v, ...rest] = h.split("/");
  const view = (VIEWS as string[]).includes(v) ? (v as View) : "lookup";
  return { view, query: rest.join("/") };
}

function readInitialLang(): Lang {
  try {
    const saved = localStorage.getItem("hanglyph.lang") ?? localStorage.getItem("chct.lang");
    return saved === "zh" || saved === "en" ? saved : "zh";
  } catch {
    return "zh";
  }
}

function readInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem("hanglyph.theme") ?? localStorage.getItem("chct.theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function App() {
  const [lang, setLang] = useState<Lang>(readInitialLang);
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  useEffect(() => {
    try {
      localStorage.setItem("hanglyph.lang", lang);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";
  }, [lang]);

  useLayoutEffect(() => {
    try {
      localStorage.setItem("hanglyph.theme", theme);
    } catch {
      /* ignore */
    }
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const ctx = useMemo(() => ({ lang, setLang }), [lang]);
  return (
    <I18nContext.Provider value={ctx}>
      <Shell theme={theme} setTheme={setTheme} />
    </I18nContext.Provider>
  );
}

function Shell({ theme, setTheme }: { theme: Theme; setTheme: (theme: Theme) => void }) {
  const { t, lang, setLang } = useI18n();
  const [db, setDb] = useState<"loading" | "ready" | "missing">("loading");
  const [route, setRoute] = useState(parseHash);

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
    <div className="app min-h-full bg-[var(--bg)] text-[var(--ink)] transition-colors">
      <header className="header">
        <span className="brand">HanGlyph<span className="dot">·</span></span>
        <span className="tagline">{t("tagline")}</span>
        <div className="header-actions">
          <div className="theme-toggle text-xs dark:text-stone-200" title={t("theme_toggle")}>
            <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}>
              {t("theme_light")}
            </button>
            <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}>
              {t("theme_dark")}
            </button>
          </div>
          <div className="langtoggle">
            <button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中</button>
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
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
          {route.view === "blocks" && <BlocksView />}
          {route.view === "about" && <AboutView />}
        </main>
      )}
    </div>
  );
}

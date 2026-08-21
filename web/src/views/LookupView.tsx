import { useEffect, useRef, useState } from "react";
import { lookupCharacter, randomCharacters } from "../db/queries";
import type { CharacterRow } from "../db/types";
import { CharDetail } from "../components/CharDetail";
import { useI18n } from "../i18n";

interface Props {
  initial: string;
  onQueryChange: (q: string) => void;
}

export function LookupView({ initial, onQueryChange }: Props) {
  const { t } = useI18n();
  const [input, setInput] = useState(initial);
  const [char, setChar] = useState<CharacterRow | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "notfound">("idle");
  const [featured, setFeatured] = useState<CharacterRow[] | null>(null);
  const requestSeq = useRef(0);
  const lastRequested = useRef("");

  async function run(raw: string, syncRoute = true) {
    const q = raw.trim();
    if (!q) return;
    const seq = ++requestSeq.current;
    lastRequested.current = q;
    setState("loading");
    if (syncRoute && q !== initial) onQueryChange(q);
    try {
      const row = await lookupCharacter(q);
      if (seq !== requestSeq.current) return;
      setChar(row);
      setState(row ? "idle" : "notfound");
    } catch (e) {
      console.error(e);
      if (seq !== requestSeq.current) return;
      setChar(null);
      setState("notfound");
    }
  }

  useEffect(() => {
    const q = initial.trim();
    if (!q) return;
    setInput(initial);
    if (q !== lastRequested.current) run(initial, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  useEffect(() => {
    let alive = true;
    randomCharacters(3)
      .then((rows) => {
        if (alive) setFeatured(rows);
      })
      .catch((e) => {
        console.error(e);
        if (alive) setFeatured([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  function navigateTo(c: string) {
    setInput(c);
    run(c);
  }

  return (
    <div>
      <form
        className="searchbar"
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("search_placeholder")}
          autoFocus
        />
        <button className="btn" type="submit">{t("search_btn")}</button>
      </form>

      {state === "loading" && <div className="center"><div className="spinner" /></div>}
      {state === "notfound" && <div className="center err">{t("not_found")}</div>}
      {char && state !== "loading" && (
        <CharDetail
          char={char}
          onNavigate={navigateTo}
        />
      )}

      <section className="lookup-featured">
        <div className="section-title">{t("lookup_random_title")}</div>
        {featured === null && (
          <div className="center compact">
            <div className="spinner" />
            <div>{t("lookup_random_loading")}</div>
          </div>
        )}
        {featured?.map((row) => (
          <CharDetail key={row.id} char={row} onNavigate={navigateTo} />
        ))}
      </section>
    </div>
  );
}

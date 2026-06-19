import { useEffect, useState } from "react";
import { lookupCharacter } from "../db/queries";
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

  async function run(raw: string) {
    const q = raw.trim();
    if (!q) return;
    setState("loading");
    onQueryChange(q);
    const row = await lookupCharacter(q);
    setChar(row);
    setState(row ? "idle" : "notfound");
  }

  useEffect(() => {
    if (initial) {
      setInput(initial);
      run(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

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
          onNavigate={(c) => {
            setInput(c);
            run(c);
          }}
        />
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Palette, PanelRight, Search } from "lucide-react";
import { NAV_ITEMS } from "./navigation";
import type { Page, Theme } from "../types";

const THEMES: { id: Theme; label: string; swatch: [string, string, string] }[] = [
  { id: "lavande", label: "Lavande", swatch: ["#7b35ee", "#ffc933", "#ff4fa3"] },
  { id: "sombre", label: "Sombre", swatch: ["#1a1340", "#8b6cff", "#ff5fae"] },
  { id: "menthe", label: "Menthe", swatch: ["#0b8a68", "#ffc933", "#2f8cf0"] },
  { id: "custom", label: "Perso", swatch: ["#8b5cf6", "#ffc933", "#ff4fa3"] },
];

export default function TopBar({
  setPage,
  theme,
  setTheme,
  accentColor,
  setAccentColor,
  live,
  panelOpen,
  togglePanel,
}: {
  setPage: (p: Page) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  /** true quand les mesures système arrivent du backend */
  live: boolean;
  panelOpen: boolean;
  togglePanel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [themeOpen, setThemeOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV_ITEMS.filter((i) => i.label.toLowerCase().includes(q));
  }, [query]);

  // Ferme la recherche et le menu des thèmes au clic extérieur ou sur Échap
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setQuery("");
      if (toolsRef.current && !toolsRef.current.contains(target)) setThemeOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuery("");
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const go = (id: Page) => {
    setPage(id);
    setQuery("");
  };

  const currentTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <header className="sp-top">
      <div className="sp-search" ref={searchRef}>
        <Search size={16} />
        <input
          type="search"
          placeholder="Rechercher une page ou une fonction..."
          aria-label="Rechercher une page"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && matches[0]) go(matches[0].id);
          }}
        />
        {query.trim() !== "" && (
          <div className="sp-results">
            {matches.length === 0 ? (
              <div className="sp-results__empty">Aucune page ne correspond à « {query} ».</div>
            ) : (
              matches.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => go(id)}>
                  <Icon size={16} />
                  {label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="sp-top__tools" ref={toolsRef}>
        <span className={`sp-live ${live ? "sp-live--on" : ""}`}>
          <i />
          {live ? "Mesures en direct" : "En attente des mesures"}
        </span>

        <button
          type="button"
          className="sp-iconbtn"
          aria-pressed={panelOpen}
          aria-label={
            panelOpen ? "Masquer le panneau de droite" : "Afficher le panneau de droite"
          }
          title={panelOpen ? "Masquer le panneau de droite" : "Afficher le panneau de droite"}
          onClick={togglePanel}
        >
          <PanelRight size={18} />
        </button>

        <button
          type="button"
          className="sp-iconbtn"
          aria-expanded={themeOpen}
          aria-label={`Changer de thème (actuel : ${currentTheme.label})`}
          title="Changer de thème"
          onClick={() => setThemeOpen((o) => !o)}
        >
          <Palette size={18} />
        </button>

        {themeOpen && (
          <div className="sp-pop" role="menu" aria-label="Thèmes">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={t.id === theme}
                onClick={() => {
                  setTheme(t.id);
                  // Le thème perso reste ouvert pour choisir la couleur
                  if (t.id !== "custom") setThemeOpen(false);
                }}
              >
                <span className="sp-swatches" aria-hidden="true">
                  {(t.id === "custom"
                    ? [accentColor, t.swatch[1], t.swatch[2]]
                    : t.swatch
                  ).map((c, i) => (
                    <i key={i} style={{ background: c }} />
                  ))}
                </span>
                <span style={{ flex: 1 }}>{t.label}</span>
                {t.id === theme && <Check size={16} />}
              </button>
            ))}
            {theme === "custom" && (
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                title="Couleur d'accent"
                aria-label="Couleur d'accent"
              />
            )}
          </div>
        )}
      </div>
    </header>
  );
}

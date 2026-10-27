import { useEffect, useRef } from "react";
import Logo from "./Logo";
import { NAV_ITEMS } from "./navigation";
import type { Page } from "../types";

export default function Sidebar({
  page,
  setPage,
}: {
  page: Page;
  setPage: (p: Page) => void;
}) {
  const navRef = useRef<HTMLElement>(null);

  // Garde l'onglet actif visible quand on change de page (recherche, raccourcis...)
  useEffect(() => {
    const active = navRef.current?.querySelector('[aria-current="page"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [page]);

  return (
    <aside className="sp-side">
      <div className="sp-brand">
        <Logo />
        <span>
          Supervision
          <br />
          PC
        </span>
      </div>

      <nav className="sp-nav" ref={navRef} aria-label="Navigation principale">
        {NAV_ITEMS.map(({ id, label, short, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="sp-nav__item"
            aria-current={id === page ? "page" : undefined}
            title={label}
            onClick={() => setPage(id)}
          >
            <Icon size={21} strokeWidth={1.9} />
            <span>{short}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

import {
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ==========================================================================
   Types et petites fonctions utilitaires
   ========================================================================== */

export type Tone = "ok" | "warn" | "danger" | "info";
export type Swatch =
  | "accent"
  | "pink"
  | "blue"
  | "orange"
  | "yellow"
  | "green"
  | "red"
  | "teal";

const SWATCH: Record<Swatch, string> = {
  accent: "var(--accent)",
  pink: "var(--c-pink)",
  blue: "var(--c-blue)",
  orange: "var(--c-orange)",
  yellow: "var(--c-yellow)",
  green: "var(--ok)",
  red: "var(--danger)",
  teal: "var(--c-teal)",
};

export const TONE_LABEL: Record<Tone, string> = {
  ok: "Normal",
  warn: "Attention",
  danger: "Critique",
  info: "Info",
};

const TONE_COLOR: Record<Tone, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  danger: "var(--danger)",
  info: "var(--accent)",
};

export function clampPercent(p: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0));
}

/** Vert sous 60 %, orange sous 85 %, rouge au-delà (mêmes seuils qu'avant). */
export function toneForPercent(percent: number): Tone {
  if (percent < 60) return "ok";
  if (percent < 85) return "warn";
  return "danger";
}

export function formatSpeed(kbps: number): string {
  return kbps >= 1000
    ? `${(kbps / 1000).toFixed(2)} Mb/s`
    : `${kbps.toFixed(0)} kb/s`;
}

/** Style commun des info-bulles des graphiques Recharts. */
export const chartTooltipStyle: CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  color: "var(--text-main)",
  boxShadow: "var(--card-shadow)",
};

/* ==========================================================================
   Pastille d'icône
   ========================================================================== */

export function IconChip({
  icon: Icon,
  color = "accent",
  size = 40,
  spin = false,
}: {
  icon: LucideIcon;
  color?: Swatch;
  size?: number;
  spin?: boolean;
}) {
  const c = SWATCH[color];
  return (
    <span
      className="sp-chip"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 66%, black))`,
      }}
    >
      <Icon size={Math.round(size * 0.5)} className={spin ? "animate-spin" : ""} />
    </span>
  );
}

/* ==========================================================================
   En-tête de page
   ========================================================================== */

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  color = "accent",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  color?: Swatch;
}) {
  return (
    <div className="sp-pagehead">
      <div className="sp-pagehead__id">
        <IconChip icon={icon} color={color} size={46} />
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="sp-pagehead__actions">{actions}</div>}
    </div>
  );
}

/* ==========================================================================
   Carte
   ========================================================================== */

export function Card({
  title,
  icon: Icon,
  action,
  children,
  className = "",
  flush = false,
}: {
  title?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Sans marge intérieure (tableaux et listes pleine largeur) */
  flush?: boolean;
}) {
  return (
    <section className={`sp-card ${flush ? "sp-card--flush" : ""} ${className}`}>
      {(title || action) && (
        <header className="sp-card__head">
          {title ? (
            <h3 className="sp-card__title">
              {Icon && <Icon size={17} />}
              {title}
            </h3>
          ) : (
            <span />
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/* ==========================================================================
   Bannière d'information
   ========================================================================== */

export function Banner({
  tone,
  icon,
  children,
  action,
  onClose,
}: {
  tone: Tone;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
}) {
  const Icon = icon ?? (tone === "ok" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle);
  return (
    <div className={`sp-banner sp-tone--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon size={19} />
      <div className="sp-banner__body">{children}</div>
      {action}
      {onClose && (
        <button type="button" className="sp-banner__close" onClick={onClose} aria-label="Fermer">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
   Bouton
   ========================================================================== */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "success" | "warn" | "ghost" | "hero";
  size?: "md" | "sm";
  icon?: LucideIcon;
  /** Fait tourner l'icône (action en cours) */
  spinning?: boolean;
  /** Pleine largeur */
  block?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  spinning = false,
  block = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const v = variant === "primary" ? "" : `sp-btn--${variant}`;
  const s = size === "sm" ? "sp-btn--sm" : "";
  const b = block ? "sp-btn--block" : "";
  return (
    <button type="button" {...rest} className={`sp-btn ${v} ${s} ${b} ${className}`}>
      {Icon && <Icon size={size === "sm" ? 14 : 16} className={spinning ? "animate-spin" : ""} />}
      {children}
    </button>
  );
}

/* ==========================================================================
   Badge, barre de progression
   ========================================================================== */

export function Badge({
  tone,
  children,
  dot = false,
}: {
  tone?: Tone | "accent" | "upload";
  children: ReactNode;
  /** Petit point devant le texte */
  dot?: boolean;
}) {
  const cls = !tone
    ? ""
    : tone === "accent" || tone === "upload"
      ? `sp-badge--${tone}`
      : `sp-tone--${tone}`;
  return (
    <span className={`sp-badge ${cls}`}>
      {dot && <span className="sp-dot" />}
      {children}
    </span>
  );
}

export function ProgressBar({
  percent,
  tone,
  height = 8,
}: {
  percent: number;
  tone?: Tone;
  height?: number;
}) {
  const p = clampPercent(percent);
  const t = tone ?? toneForPercent(p);
  return (
    <div className="sp-progress" style={{ height }}>
      <div className={`sp-progress__bar sp-tone--${t}`} style={{ width: `${p}%` }} />
    </div>
  );
}

/* ==========================================================================
   Carte de mesure
   ========================================================================== */

export function StatCard({
  icon,
  label,
  value,
  sub,
  color = "accent",
  tone,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color?: Swatch;
  /** Colore la valeur (ex. : alerte) */
  tone?: Tone;
  children?: ReactNode;
}) {
  return (
    <div className="sp-card sp-stat">
      <div className="sp-stat__top">
        <IconChip icon={icon} color={color} size={34} />
        <span>{label}</span>
      </div>
      <div className={`sp-stat__value ${tone ? `sp-tone--${tone} sp-text--tone` : ""}`}>
        {value}
      </div>
      {sub && <div className="sp-stat__sub">{sub}</div>}
      {children}
    </div>
  );
}

/* ==========================================================================
   Jauge circulaire
   ========================================================================== */

export function RingGauge({
  percent,
  label,
  size = 132,
  tone,
}: {
  percent: number;
  label: string;
  size?: number;
  tone?: Tone;
}) {
  const p = clampPercent(percent);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const t = tone ?? toneForPercent(p);

  return (
    <div
      className="sp-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label} : ${Math.round(p)} %`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--track)" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={TONE_COLOR[t]}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(circumference * p) / 100} ${circumference}`}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <div className="sp-ring__center">
        <strong>
          {Math.round(p)}
          <small>%</small>
        </strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

/* ==========================================================================
   Sélecteur segmenté (onglets / tri)
   ========================================================================== */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="sp-seg" role="group">
      {options.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" aria-pressed={id === value} onClick={() => onChange(id)}>
          {Icon && <Icon size={14} />}
          {label}
        </button>
      ))}
    </div>
  );
}

/* ==========================================================================
   État vide
   ========================================================================== */

export function EmptyState({
  icon,
  title,
  children,
  spin = false,
  color = "accent",
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  spin?: boolean;
  color?: Swatch;
}) {
  return (
    <div className="sp-empty">
      <IconChip icon={icon} color={color} size={56} spin={spin} />
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

/* ==========================================================================
   Champ de formulaire
   ========================================================================== */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="sp-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

/* ==========================================================================
   Courbe (aire) compacte, tracée à partir de vraies valeurs
   ========================================================================== */

export function Sparkline({
  values,
  color = "var(--accent)",
  height = 80,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  const gradId = useId();

  if (values.length < 2) {
    return (
      <p className="sp-muted" style={{ fontSize: 12, margin: 0 }}>
        Pas encore assez de mesures pour tracer la courbe.
      </p>
    );
  }

  const w = 300;
  const h = 100;
  const max = Math.max(...values, 1);
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - (v / max) * (h - 8) - 4] as const);
  const line = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.45" />
          <stop offset="1" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ==========================================================================
   Bannière d'accueil
   ========================================================================== */

export function Hero({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <section className="sp-hero">
      <div className="sp-hero__text">
        <h2>{title}</h2>
        <p>{text}</p>
        {action}
      </div>
      <svg
        className="sp-hero__art"
        viewBox="0 0 300 160"
        preserveAspectRatio="xMaxYMax slice"
        aria-hidden="true"
      >
        <circle cx="215" cy="42" r="22" fill="var(--hills-2)" opacity="0.7" />
        <path d="M40 160 C80 70 120 70 170 160 Z" fill="var(--hills-2)" />
        <path d="M120 160 C170 40 230 40 290 160 Z" fill="var(--hills)" />
        <path d="M210 160 C240 100 280 100 310 160 Z" fill="var(--hills-2)" opacity="0.85" />
      </svg>
    </section>
  );
}

/* ==========================================================================
   Tuiles colorées cliquables
   ========================================================================== */

/** Petite tuile de raccourci (panneau de droite). */
export function ShortcutTile({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  color: Swatch;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="sp-tile"
      style={{ "--tile": SWATCH[color] } as CSSProperties}
      onClick={onClick}
    >
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );
}

/** Grande tuile d'action (page Actions rapides). */
export function BigTile({
  icon: Icon,
  title,
  description,
  color,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  color: Swatch;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="sp-bigtile"
      style={{ "--tile": SWATCH[color] } as CSSProperties}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={30} />
      <strong>{title}</strong>
      <span>{description}</span>
    </button>
  );
}

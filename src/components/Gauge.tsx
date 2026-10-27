import { useId } from "react";

interface GaugeProps {
  value: number;
  maxScale?: number;
  label: string;
  unit?: string;
}

function valueToFraction(value: number, maxScale: number) {
  const v = Math.max(0, value);
  const frac = Math.log10(v + 1) / Math.log10(maxScale + 1);
  return Math.min(1, Math.max(0, frac));
}

export default function Gauge({
  value,
  maxScale = 200,
  label,
  unit = "Mb/s",
}: GaugeProps) {
  const gradId = useId();
  const fraction = valueToFraction(value, maxScale);
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - fraction);
  const ticks = [0, 1, 10, 50, maxScale];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-80 h-48">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: "var(--accent)" }} />
            <stop offset="1" style={{ stopColor: "var(--upload)" }} />
          </linearGradient>
        </defs>
        <path
          d="M20,100 A80,80 0 0 1 180,100"
          fill="none"
          stroke="var(--track)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M20,100 A80,80 0 0 1 180,100"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
        {ticks.map((t, i) => {
          const f = valueToFraction(t, maxScale);
          const angle = Math.PI * (1 - f);
          const x = 100 + 95 * Math.cos(angle);
          const y = 100 - 95 * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              fontSize="9"
              fill="var(--text-muted)"
              textAnchor="middle"
            >
              {t}
            </text>
          );
        })}
      </svg>
      <div className="text-5xl font-bold text-(--text-main) -mt-8 tracking-tight">
        {value.toFixed(2)}
      </div>
      <div className="text-xs text-(--text-muted) mt-1 mb-1">{unit}</div>
      <div className="text-sm font-semibold text-(--text-muted)">{label}</div>
    </div>
  );
}

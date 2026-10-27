import { useId } from "react";

/** Logo Supervision PC : un bouclier (protection) traversé par une pulsation (surveillance en temps réel). */
export default function Logo({ size = 46 }: { size?: number }) {
  const gradId = useId();

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label="Supervision PC"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc933" />
          <stop offset="1" stopColor="#ff4fa3" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="#ffffff" />
      <path
        d="M24 8 L38 13 V23 C38 31.5 32 37.5 24 40 C16 37.5 10 31.5 10 23 V13 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M14 24 H20 L22.5 18 L26 30 L28.5 24 H34"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

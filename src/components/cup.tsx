type CupProps = {
  tone?: "coral" | "caramel" | "leaf" | "cream" | "sky";
  doubleWall?: boolean;
  label?: string;
  className?: string;
};

const tones: Record<
  NonNullable<CupProps["tone"]>,
  { body: string; band: string; lid: string; liquid: string }
> = {
  coral: { body: "#f7a98f", band: "#ef6b4b", lid: "#3a2417", liquid: "#3a2417" },
  caramel: { body: "#d6a878", band: "#b9824f", lid: "#3a2417", liquid: "#3a2417" },
  leaf: { body: "#a7d98c", band: "#5fae3d", lid: "#3a2417", liquid: "#3a2417" },
  cream: { body: "#f1e4d0", band: "#d6a878", lid: "#6f4a30", liquid: "#6f4a30" },
  sky: { body: "#a9dde8", band: "#6fc3d6", lid: "#3a2417", liquid: "#3a2417" },
};

/** Stylized, brand-colored to-go cup illustration. */
export function Cup({
  tone = "caramel",
  doubleWall = false,
  label,
  className = "",
}: CupProps) {
  const c = tones[tone];
  return (
    <svg
      viewBox="0 0 200 260"
      className={className}
      role="img"
      aria-label={label ?? "PHA compostable cup"}
    >
      {/* lid */}
      <ellipse cx="100" cy="36" rx="74" ry="16" fill={c.lid} />
      <rect x="26" y="30" width="148" height="18" rx="9" fill={c.lid} />
      <rect x="74" y="14" width="52" height="16" rx="8" fill={c.lid} opacity="0.9" />
      {/* cup body (trapezoid) */}
      <path
        d="M34 56 L166 56 L150 236 Q149 246 139 246 L61 246 Q51 246 50 236 Z"
        fill={c.body}
      />
      {/* sip rim */}
      <path d="M34 56 L166 56 L162 70 L38 70 Z" fill={c.band} opacity="0.6" />
      {/* center band */}
      <path d="M44 120 L156 120 L150 168 L50 168 Z" fill={c.band} />
      {/* double wall ridges */}
      {doubleWall && (
        <>
          <path d="M40 92 L160 92 L159 100 L41 100 Z" fill={c.band} opacity="0.45" />
          <path d="M46 184 L154 184 L153 192 L47 192 Z" fill={c.band} opacity="0.45" />
        </>
      )}
      {/* leaf mark */}
      <path
        d="M100 132 c-10 0 -18 8 -18 18 c10 0 18 -8 18 -18 Z"
        fill="#faf3e8"
        opacity="0.85"
      />
      <path d="M100 150 c0 -8 0 -14 0 -18" stroke="#faf3e8" strokeWidth="2" opacity="0.7" />
      {label && (
        <text
          x="100"
          y="220"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="15"
          fontWeight="700"
          fill="#faf3e8"
        >
          {label}
        </text>
      )}
    </svg>
  );
}

import Image from "next/image";

/** cupcasa wordmark (with the dissolving-particle 'a'). */
export function Logo({
  variant = "black",
  className = "h-7 w-auto",
  priority = false,
}: {
  variant?: "black" | "white";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/brand/wordmark-${variant}.png`}
      alt="cupcasa"
      width={4000}
      height={1049}
      priority={priority}
      className={className}
    />
  );
}

/** The standalone 'C' brand mark that disperses into particles. */
export function Mark({
  variant = "black",
  className = "h-8 w-auto",
}: {
  variant?: "black" | "white";
  className?: string;
}) {
  return (
    <Image
      src={`/brand/mark-${variant}.png`}
      alt="cupcasa mark"
      width={variant === "white" ? 2048 : 4000}
      height={variant === "white" ? 1772 : 3462}
      className={className}
    />
  );
}

// A deterministic scatter that trails to the right & down — the "dissolve".
const DOTS: [number, number, number][] = [
  [3, 30, 3.4], [11, 25, 2.9], [10, 39, 2.5], [19, 33, 2.7], [26, 23, 1.9],
  [28, 41, 2.1], [35, 31, 2.2], [43, 22, 1.5], [45, 39, 1.7], [52, 32, 1.6],
  [59, 26, 1.2], [61, 41, 1.3], [69, 31, 1.0], [77, 28, 0.85], [85, 34, 0.7],
  [93, 30, 0.6],
];

/** Decorative particle trail. Color via text-* (uses currentColor). */
export function Particles({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" className={className} aria-hidden="true" fill="currentColor">
      {DOTS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} />
      ))}
    </svg>
  );
}

/** A denser upward "speckle" field — mimics the coral dissolve at a cup's base. */
export function Speckle({ className = "" }: { className?: string }) {
  const rows = 7;
  const cols = 22;
  const dots: React.ReactNode[] = [];
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let r = 0; r < rows; r++) {
    const density = 1 - r / rows; // denser at the bottom
    for (let c = 0; c < cols; c++) {
      if (rand() > density * 0.9 + 0.08) continue;
      const x = (c / cols) * 100 + (rand() - 0.5) * 4;
      const y = 100 - (r / rows) * 100 - rand() * 6;
      const rad = 0.8 + density * 2.2 * rand();
      dots.push(<circle key={`${r}-${c}`} cx={x} cy={y} r={rad} />);
    }
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className} aria-hidden="true" fill="currentColor">
      {dots}
    </svg>
  );
}

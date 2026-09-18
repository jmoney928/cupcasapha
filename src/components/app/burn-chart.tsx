/** Tiny server-rendered bar chart of daily cups used over the last N days. */
export function BurnChart({ days, series, height = 96 }: { days: string[]; series: { label: string; values: number[] }[]; height?: number }) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const n = days.length;
  const w = 600, h = height, pad = 4;
  const colors = ["#e8735a", "#2e4a38", "#9b9b94", "#8fb3a3", "#e7c9a3", "#cf5b44"];
  const bw = (w - pad * 2) / n;
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" role="img" aria-label="Daily cup usage">
        {days.map((_, i) => (
          <g key={i} transform={`translate(${pad + i * bw},0)`}>
            {(() => {
              let y = h;
              return series.map((s, si) => {
                const v = s.values[i] ?? 0;
                const bh = (v / max) * (h - 8);
                y -= bh;
                return <rect key={si} x={1} y={y} width={Math.max(1, bw - 2)} height={bh} fill={colors[si % colors.length]} rx={1} />;
              });
            })()}
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-3 text-[11px] text-cocoa">
        <span>{days[0]?.slice(5)} → {days[n - 1]?.slice(5)}</span>
        {series.map((s, i) => (
          <span key={s.label} className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: colors[i % colors.length] }} />{s.label}</span>
        ))}
        <span className="ml-auto">peak {max}/day</span>
      </figcaption>
    </figure>
  );
}

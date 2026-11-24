/**
 * The score, rendered as a ring. Purely presentational.
 * 1.0 = empty, 5.0 = full circle.
 */
export function ScoreRing({
  score,
  size = 168,
  stroke = 10,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, (score - 1) / 4));
  const dash = circumference * pct;

  const tone =
    score >= 4.5
      ? "#67e8f9"
      : score >= 4.2
        ? "#fcd34d"
        : score >= 3.8
          ? "#d4d4d8"
          : score >= 3.0
            ? "#fb923c"
            : "#f87171";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1d1d26"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 700ms ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="score-display font-bold leading-none" style={{ fontSize: size * 0.28, color: tone }}>
          {score.toFixed(2)}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">de 5.00</div>
      </div>
    </div>
  );
}

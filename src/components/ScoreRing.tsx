/**
 * The score, rendered as a soft ring. 1.0 = empty, 5.0 = full.
 * Pastel version of the mockup's big number.
 */
export function ScoreRing({
  score,
  size = 176,
  stroke = 12,
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
      ? "#7fb8dd"
      : score >= 4.2
        ? "#e8b446"
        : score >= 3.8
          ? "#a9a3bd"
          : score >= 3.0
            ? "#e8a08a"
            : "#e8836b";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(59,53,80,.08)"
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
        <div
          className="score-display leading-none"
          style={{ fontSize: size * 0.3, color: tone }}
        >
          {score.toFixed(1)}
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a49db8]">
          de 5.0
        </div>
      </div>
    </div>
  );
}

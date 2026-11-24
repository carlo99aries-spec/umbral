/** Star from the mockup: 24px viewBox, gold fill with a darker stroke. */
export function Star({ size = 26, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M12 2l3 7 7 .6-5.4 4.7 1.7 7.3L12 17.8 5.7 21.6l1.7-7.3L2 9.6 9 9z"
        fill={filled ? "#F2B84B" : "none"}
        stroke="#B9852B"
        strokeWidth={filled ? 1 : 1.5}
      />
    </svg>
  );
}

export function StarRow({ value, size = 26 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} filled={n <= Math.round(value)} />
      ))}
    </div>
  );
}

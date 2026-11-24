import { initials } from "@/lib/format";

export function Avatar({
  name,
  hue,
  size = 40,
  ring = false,
}: {
  name: string;
  hue: number;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div
      className={`shrink-0 grid place-items-center rounded-full font-semibold text-white/95 select-none ${
        ring ? "ring-2 ring-white/10" : ""
      }`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.36),
        background: `linear-gradient(135deg, hsl(${hue} 62% 46%), hsl(${(hue + 48) % 360} 62% 28%))`,
      }}
      aria-hidden="true"
    >
      {initials(name) || "?"}
    </div>
  );
}

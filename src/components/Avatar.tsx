import { initials } from "@/lib/format";

/**
 * Pastel avatar: hue drives a soft two-stop gradient, initials in deep ink.
 * Matches the mockup's rounded, low-contrast portraits.
 */
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
      className={`shrink-0 grid place-items-center rounded-full font-extrabold select-none ${
        ring ? "ring-4 ring-white" : ""
      }`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.36),
        color: "#3b3550",
        background: `linear-gradient(135deg, hsl(${hue} 62% 86%), hsl(${(hue + 40) % 360} 58% 78%))`,
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.7)",
      }}
      aria-hidden="true"
    >
      {initials(name) || "?"}
    </div>
  );
}

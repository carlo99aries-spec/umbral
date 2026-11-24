import type { TierName } from "@/lib/reputation";

const STYLES: Record<TierName, string> = {
  PLATINUM: "from-cyan-100 via-white to-cyan-200 text-zinc-900",
  GOLD: "from-amber-200 via-yellow-300 to-amber-400 text-amber-950",
  SILVER: "from-zinc-200 via-zinc-300 to-zinc-400 text-zinc-900",
  BRONZE: "from-orange-800 via-amber-800 to-orange-900 text-orange-100",
  RESTRICTED: "from-red-900 via-rose-900 to-red-950 text-rose-100",
};

export function TierBadge({
  name,
  label,
  size = "md",
}: {
  name: TierName;
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  const pad = size === "lg" ? "px-3.5 py-1.5 text-sm" : size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r font-semibold uppercase tracking-widest ${STYLES[name]} ${pad}`}
    >
      {label}
    </span>
  );
}

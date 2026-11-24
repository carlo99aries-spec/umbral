import type { TierName } from "@/lib/reputation";

const STYLES: Record<TierName, string> = {
  PLATINUM: "bg-[#d6e8f7] text-[#2f5c80]",
  GOLD: "bg-[#fbe3a6] text-[#7a5715]",
  SILVER: "bg-[#eceaf2] text-[#5a5470]",
  BRONZE: "bg-[#f7d3dd] text-[#8a4552]",
  RESTRICTED: "bg-[#f3cfc8] text-[#8a3f33]",
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
  const pad =
    size === "lg"
      ? "px-4 py-1.5 text-sm"
      : size === "sm"
        ? "px-2.5 py-0.5 text-[10px]"
        : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full font-extrabold uppercase tracking-wider ${STYLES[name]} ${pad}`}
    >
      {label}
    </span>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Feed" },
  { href: "/cerca", label: "Cerca" },
  { href: "/alertas", label: "Alertas" },
  { href: "/perfil", label: "Perfil" },
];

/** Bottom tab bar from the mockup: active tab is a pink pill. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[560px] px-2 pb-2">
      <div className="flex justify-around rounded-t-3xl bg-white/95 px-2 pb-4 pt-2 shadow-[0_-6px_24px_rgba(59,53,80,.08)] backdrop-blur">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`grid min-h-12 min-w-[72px] place-items-center rounded-2xl text-sm transition ${
                active
                  ? "bg-[#f7d3dd] font-extrabold text-[#3b3550]"
                  : "font-bold text-[#6b6480] hover:text-[#3b3550]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

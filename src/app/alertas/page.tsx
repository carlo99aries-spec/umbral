import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { StarRow } from "@/components/Star";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Alertas — Umbral" };

export default async function AlertsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const [ratings, postRatings] = await Promise.all([
    prisma.rating.findMany({
      where: { subjectId: me.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.postRating.findMany({
      where: { post: { authorId: me.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { post: { select: { caption: true } } },
    }),
  ]);

  type Item = { id: string; kind: "reputacion" | "aura"; stars: number; at: Date; detail: string };
  const items: Item[] = [
    ...ratings.map((r) => ({
      id: `r-${r.id}`,
      kind: "reputacion" as const,
      stars: r.stars,
      at: r.createdAt,
      detail: "una interacción verificada",
    })),
    ...postRatings.map((r) => ({
      id: `p-${r.id}`,
      kind: "aura" as const,
      stars: r.stars,
      at: r.createdAt,
      detail: r.post.caption ? `tu publicación «${r.post.caption.slice(0, 40)}…»` : "tu publicación",
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Alertas</h1>
        <p className="mt-1 text-sm text-[#6b6480]">
          Quién te calificó nunca se publica. Solo ves la estrella y el efecto.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-[#6b6480]">
          Nada todavía. Genera un código y deja que alguien te califique.
        </p>
      ) : (
        <section className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="panel flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="text-sm font-extrabold">
                  {item.kind === "reputacion" ? "Recibiste una calificación" : "Calificaron tu publicación"}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-[#6b6480]">
                  {item.detail} · {timeAgo(item.at)}
                </p>
              </div>
              <StarRow value={item.stars} size={18} />
              <span
                className={`pill shrink-0 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                  item.kind === "reputacion"
                    ? "bg-[#cdebe0] text-[#2f6b57]"
                    : "bg-[#d6e8f7] text-[#2f5c80]"
                }`}
              >
                {item.kind === "reputacion" ? "puntaje" : "aura"}
              </span>
            </div>
          ))}
        </section>
      )}

      <Link href="/en-persona" className="btn-ghost block px-5 py-3 text-center text-sm">
        Calificar a alguien
      </Link>
    </div>
  );
}

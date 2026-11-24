import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { TierBadge } from "@/components/TierBadge";
import { computeScore, resolveTier } from "@/lib/reputation";

export const metadata = { title: "Cerca — Umbral" };

export default async function NearbyPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  // One ratings query for the whole directory, scored with stored snapshots.
  // Live influence would mean a per-user lookup; this list is a directory, not
  // a verdict, so the cheaper model is the right one here.
  const people = await prisma.user.findMany({
    where: { id: { not: me.id }, suspended: false },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  const ids = people.map((p) => p.id);
  const ratings = ids.length
    ? await prisma.rating.findMany({
        where: { subjectId: { in: ids } },
        select: { subjectId: true, stars: true, raterScore: true, createdAt: true, reciprocal: true },
      })
    : [];

  const bySubject = new Map<string, typeof ratings>();
  for (const r of ratings) {
    const list = bySubject.get(r.subjectId);
    if (list) list.push(r);
    else bySubject.set(r.subjectId, [r]);
  }

  const rows = people
    .map((person) => {
      const score = computeScore(bySubject.get(person.id) ?? []);
      return { person, score, tier: resolveTier(score.score, score.sampleSize) };
    })
    .sort((a, b) => b.score.score - a.score.score);

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Cerca</h1>
        <p className="mt-1 text-sm text-[#6b6480]">
          Gente en Umbral. Para calificar a alguien necesitas su código: no se puede calificar en
          frío.
        </p>
      </div>

      <Link
        href="/en-persona"
        className="block rounded-[18px] bg-[#3b3550] px-5 py-4 text-center text-base font-extrabold text-white"
      >
        Calificar a alguien cercano
      </Link>

      <section className="space-y-2">
        {rows.map(({ person, score, tier }) => (
          <div key={person.id} className="panel flex items-center gap-3 p-3.5">
            <Link href={`/u/${person.handle}`}>
              <Avatar name={person.displayName} hue={person.avatarHue} size={44} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/u/${person.handle}`}
                className="block truncate text-[15px] font-extrabold hover:underline"
              >
                {person.displayName}
              </Link>
              <p className="truncate text-[13px] text-[#6b6480]">
                @{person.handle} · {score.sampleSize} calificaciones
              </p>
            </div>
            <TierBadge name={tier.name} label={tier.label} size="sm" />
            <span className="pill w-14 shrink-0 bg-[#fbe3a6] py-1 text-center text-sm font-extrabold text-[#7a5715]">
              {score.score.toFixed(1)}
            </span>
          </div>
        ))}

        {rows.length === 0 && (
          <p className="panel p-6 text-center text-sm text-[#6b6480]">
            Todavía no hay nadie más aquí.
          </p>
        )}
      </section>
    </div>
  );
}

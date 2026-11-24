import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadProfile } from "@/lib/profile";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { ScoreRing } from "@/components/ScoreRing";
import { TierBadge } from "@/components/TierBadge";
import { ReportForm } from "@/components/ReportForm";
import { stars, timeAgo } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle} — Umbral` };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ rated?: string }>;
}) {
  const { handle } = await params;
  const { rated } = await searchParams;

  const profile = await loadProfile(handle);
  if (!profile) notFound();

  const me = await getCurrentUser();
  const isMe = me?.id === profile.user.id;
  const { user, score, tier, progress, ratings } = profile;

  return (
    <div className="space-y-6">
      {rated && (
        <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          Calificación registrada. Su número ya se movió.
        </div>
      )}

      {/* ------------------------------------------------------ cabecera */}
      <section className="panel overflow-hidden rounded-2xl">
        <div
          className="h-24 w-full"
          style={{
            background: `linear-gradient(115deg, hsl(${user.avatarHue} 55% 22%), hsl(${(user.avatarHue + 60) % 360} 45% 12%))`,
          }}
        />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar name={user.displayName} hue={user.avatarHue} size={80} ring />
              <div className="pb-1">
                <h1 className="text-xl font-bold tracking-tight text-white">{user.displayName}</h1>
                <p className="text-sm text-zinc-500">@{user.handle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-1">
              <TierBadge name={tier.name} label={tier.label} size="lg" />
              {isMe && (
                <Link
                  href="/settings"
                  className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600"
                >
                  Ajustes
                </Link>
              )}
            </div>
          </div>

          {user.bio && <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">{user.bio}</p>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* -------------------------------------------------- columna score */}
        <div className="space-y-4">
          <section className="panel flex flex-col items-center rounded-2xl p-6">
            <ScoreRing score={score.score} />
            <p className="mt-4 text-center text-sm text-zinc-400">{tier.blurb}</p>

            <div className="mt-5 grid w-full grid-cols-2 gap-3 border-t border-zinc-900 pt-4 text-center">
              <div>
                <div className="font-mono text-lg text-zinc-200">{score.sampleSize}</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-600">calificaciones</div>
              </div>
              <div>
                <div className="font-mono text-lg text-zinc-200">
                  {Math.round(score.confidence * 100)}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-600">confianza</div>
              </div>
            </div>

            {progress && (
              <div className="mt-5 w-full rounded-xl border border-zinc-900 bg-zinc-950/60 p-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Siguiente: {progress.next.label}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(4, (1 - Math.max(progress.pointsNeeded / 0.5, progress.ratingsNeeded > 0 ? 1 : 0)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {progress.pointsNeeded > 0 && (
                    <>
                      Faltan <span className="text-zinc-300">{progress.pointsNeeded.toFixed(2)}</span> pts
                    </>
                  )}
                  {progress.pointsNeeded > 0 && progress.ratingsNeeded > 0 && " · "}
                  {progress.ratingsNeeded > 0 && (
                    <>
                      y <span className="text-zinc-300">{progress.ratingsNeeded}</span> calif.
                    </>
                  )}
                </p>
              </div>
            )}
          </section>

          <section className="panel rounded-2xl p-5">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Qué desbloquea</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {tier.privileges.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-zinc-700">—</span>
                  {p}
                </li>
              ))}
              <li className="flex gap-2">
                <span className="text-zinc-700">—</span>
                {tier.dailyCodes} código{tier.dailyCodes === 1 ? "" : "s"} de interacción al día
              </li>
            </ul>
          </section>

          {isMe && (
            <section className="panel rounded-2xl p-5">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Pedir una calificación
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Genera un código de un solo uso y dáselo a alguien con quien interactuaste.
              </p>
              <Link
                href="/settings"
                className="mt-3 inline-block rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200"
              >
                Generar código
              </Link>
            </section>
          )}

          {!isMe && <ReportForm handle={user.handle} />}
        </div>

        {/* ----------------------------------------------- historial */}
        <section className="panel rounded-2xl p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Calificaciones recibidas
            </h2>
            <span className="text-xs text-zinc-600">{ratings.length} en total</span>
          </div>

          {ratings.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-600">
              Sin calificaciones todavía. Un número solo, sin testigos.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-900">
              {ratings.slice(0, 50).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-amber-300">{stars(r.stars)}</span>
                      <span className="text-xs text-zinc-600">
                        rater {r.raterScore.toFixed(2)}
                      </span>
                      {r.reciprocal && (
                        <span
                          title="Intercambio mutuo detectado: peso reducido"
                          className="rounded border border-amber-900/60 bg-amber-950/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-amber-500"
                        >
                          recip.
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-600">
                      alguien · peso {r.weight.toFixed(2)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-600">{timeAgo(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 border-t border-zinc-900 pt-4 text-[11px] leading-relaxed text-zinc-600">
            Las identidades de quienes califican nunca se publican. El peso de cada voto depende del
            número de esa persona en el momento de calificar.
          </p>
        </section>
      </div>
    </div>
  );
}

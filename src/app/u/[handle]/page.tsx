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
  const { user, score, tier, progress, ratings, aura, auraCount } = profile;

  const gateScore = progress?.next.minScore ?? 5;
  const span = Math.max(0.01, gateScore - tier.minScore);
  const pct = Math.min(100, Math.max(3, ((score.score - tier.minScore) / span) * 100));

  return (
    <div className="space-y-4">
      {rated && (
        <div className="rounded-2xl bg-[#cdebe0] px-4 py-3 text-sm font-semibold text-[#2f6b57]">
          Calificación registrada. Su número ya se movió.
        </div>
      )}

      {/* ------------------------------------------------------ identidad */}
      <section className="panel p-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.displayName} hue={user.avatarHue} size={64} ring />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold text-[#3b3550]">{user.displayName}</h1>
            <p className="text-sm font-semibold text-[#a49db8]">@{user.handle}</p>
          </div>
          <TierBadge name={tier.name} label={tier.label} />
        </div>

        {user.bio && (
          <p className="mt-3 text-sm leading-relaxed text-[#6b6480]">{user.bio}</p>
        )}
      </section>

      {/* ------------------------------------------------- puntaje y meta */}
      <section className="panel px-5 pb-5 pt-6">
        <div className="flex flex-col items-center">
          <ScoreRing score={score.score} />
          <p className="mt-2 text-center text-sm font-semibold text-[#6b6480]">{tier.blurb}</p>
        </div>

        {progress ? (
          <div className="mt-6">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-extrabold text-[#3b3550]">
                Hacia {progress.next.label} · {progress.next.minScore.toFixed(1)}
              </span>
              <span className="font-bold text-[#e8836b]">
                faltan {progress.pointsNeeded.toFixed(2)}
              </span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#f3eef6]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f7d3dd] via-[#f2b84b] to-[#e8b446] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="mt-2 text-xs font-semibold text-[#a49db8]">
              {progress.ratingsNeeded > 0
                ? `Necesitas ${progress.ratingsNeeded} calificación${progress.ratingsNeeded === 1 ? "" : "es"} más para que cuente.`
                : "Ya tienes las calificaciones mínimas. Solo falta el número."}
            </p>

            <div className="mt-4 rounded-2xl bg-[#faf7fb] p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a49db8]">
                Se desbloquea en {progress.next.label}
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-[#6b6480]">
                {progress.next.privileges.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-[#e8836b]">✦</span>
                    {p}
                  </li>
                ))}
                <li className="flex gap-2">
                  <span className="text-[#e8836b]">✦</span>
                  {progress.next.dailyCodes} códigos de interacción al día
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-[#d6e8f7] px-4 py-3 text-center text-sm font-bold text-[#2f5c80]">
            Estás en la cima. No hay nada arriba — y eso también pesa.
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#f0ecf4] pt-4 text-center">
          <Stat label="reputación" value={score.score.toFixed(2)} />
          <Stat label="calificaciones" value={String(score.sampleSize)} />
          <Stat
            label="aura de contenido"
            value={aura !== null ? aura.toFixed(1) : "—"}
            hint={auraCount > 0 ? `${auraCount} votos` : "sin publicaciones"}
          />
        </div>
      </section>

      {/* ---------------------------------------------------- historial */}
      <section className="panel p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a49db8]">
            Últimas calificaciones
          </h2>
          <span className="text-xs font-semibold text-[#a49db8]">{ratings.length} en total</span>
        </div>

        {ratings.length === 0 ? (
          <p className="mt-5 text-sm text-[#6b6480]">
            Sin calificaciones todavía. Un número solo, sin testigos.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#f3eef6]">
            {ratings.slice(0, 12).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm tracking-tight text-[#f2b84b]">{stars(r.stars)}</span>
                    {r.reciprocal && (
                      <span
                        title="Intercambio mutuo detectado: peso reducido"
                        className="pill bg-[#fbe3a6] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#7a5715]"
                      >
                        recip.
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-[#a49db8]">
                    de alguien con {r.raterScore.toFixed(1)} ★ · {timeAgo(r.createdAt)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                    r.delta > 0
                      ? "bg-[#cdebe0] text-[#2f6b57]"
                      : r.delta < 0
                        ? "bg-[#f7d3dd] text-[#8a4552]"
                        : "bg-[#f3eef6] text-[#a49db8]"
                  }`}
                  title="Cuánto movió tu puntaje esta calificación"
                >
                  {r.delta > 0 ? "+" : ""}
                  {r.delta.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 border-t border-[#f3eef6] pt-4 text-[11px] leading-relaxed text-[#a49db8]">
          Quien te califica nunca se publica. El peso de cada voto depende de su número en ese
          momento, y se recalcula cuando esa persona sube o baja.
        </p>
      </section>

      {isMe ? (
        <section className="panel p-5">
          <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a49db8]">
            Pedir una calificación
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6b6480]">
            Genera un código de un solo uso, muestra el QR y que la otra persona lo apunte con la
            cámara. Sin ese código, nadie puede calificarte.
          </p>
          <Link href="/settings" className="btn-primary mt-3 inline-block px-5 py-2.5 text-sm">
            Generar código
          </Link>
        </section>
      ) : (
        <div className="px-2 pb-2">
          <ReportForm handle={user.handle} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="score-display text-xl">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a49db8]">{label}</div>
      {hint && <div className="mt-0.5 text-[9px] text-[#c3bcd2]">{hint}</div>}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { loadProfile } from "@/lib/profile";
import { resolveTier } from "@/lib/reputation";
import { TokenForm } from "@/components/TokenForm";
import { LogoutButton } from "@/components/LogoutButton";
import { TierBadge } from "@/components/TierBadge";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Ajustes — Umbral" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await loadProfile(user.handle);
  const tier = profile
    ? resolveTier(profile.score.score, profile.score.sampleSize)
    : resolveTier(3.5, 0);

  const [tokens, givenCount] = await Promise.all([
    prisma.interactionToken.findMany({
      where: { issuerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.rating.count({ where: { raterId: user.id } }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Ajustes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tu número, tus códigos, tu cuenta. Nada más.
        </p>
      </div>

      {/* -------------------------------------------------------- cuenta */}
      <section className="panel rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-100">{user.displayName}</p>
            <p className="text-xs text-zinc-500">@{user.handle}</p>
          </div>
          <TierBadge name={tier.name} label={tier.label} />
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-900 pt-4 text-center">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-zinc-600">puntaje</dt>
            <dd className="mt-1 font-mono text-lg text-zinc-200">
              {profile ? profile.score.score.toFixed(2) : "3.50"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-zinc-600">recibidas</dt>
            <dd className="mt-1 font-mono text-lg text-zinc-200">{profile?.score.sampleSize ?? 0}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-zinc-600">dadas</dt>
            <dd className="mt-1 font-mono text-lg text-zinc-200">{givenCount}</dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center justify-between border-t border-zinc-900 pt-4">
          <Link
            href={`/u/${user.handle}`}
            className="text-xs text-zinc-400 underline underline-offset-4 transition hover:text-zinc-200"
          >
            Ver mi perfil público
          </Link>
          <LogoutButton />
        </div>
      </section>

      {/* ------------------------------------------------------- códigos */}
      <section className="panel rounded-2xl p-5">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          Códigos de interacción
        </h2>
        <p className="mt-2 mb-4 text-xs leading-relaxed text-zinc-500">
          Un código por interacción real. Caduca en 24 h y sirve una sola vez. Tu nivel{" "}
          <span className="text-zinc-300">{tier.label}</span> define cuántos puedes generar al día.
        </p>

        <TokenForm baseUrl={baseUrl} />

        {tokens.length > 0 && (
          <ul className="mt-6 divide-y divide-zinc-900 border-t border-zinc-900">
            {tokens.map((t) => {
              const expired = t.expiresAt.getTime() < Date.now();
              const state = t.usedAt ? "usado" : expired ? "expirado" : "activo";
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <code className="block truncate font-mono text-xs text-zinc-300">/rate/{t.code}</code>
                    <p className="truncate text-[11px] text-zinc-600">
                      {t.note || "sin contexto"} · {timeAgo(t.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider ${
                      state === "activo"
                        ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-400"
                        : "border-zinc-800 text-zinc-600"
                    }`}
                  >
                    {state}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* --------------------------------------------------------- datos */}
      <section className="panel rounded-2xl p-5">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Transparencia</h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Tus calificaciones son anónimas para el resto del mundo, pero tú puedes ver{" "}
          <em>cómo</em> se calcula tu número: estrellas, peso del votante y decay temporal. La
          fórmula completa está en <code className="text-zinc-400">src/lib/reputation.ts</code> y no
          se toca sin un commit público.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          ¿Crees que tu número está manipulado? Reporta el perfil o abre un issue en el repositorio.
        </p>
      </section>
    </div>
  );
}

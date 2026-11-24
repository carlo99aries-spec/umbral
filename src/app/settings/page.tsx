import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { loadProfile } from "@/lib/profile";
import { resolveTier } from "@/lib/reputation";
import { TokenForm } from "@/components/TokenForm";
import { ProfileForm } from "@/components/ProfileForm";
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
    <div className="space-y-4 pt-2">
      <div className="px-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#3b3550]">Ajustes</h1>
        <p className="mt-1 text-sm text-[#6b6480]">Tu número, tus códigos, tu cuenta.</p>
      </div>

      <section className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[#3b3550]">{user.displayName}</p>
            <p className="text-xs font-semibold text-[#a49db8]">@{user.handle}</p>
          </div>
          <TierBadge name={tier.name} label={tier.label} />
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#faf7fb] py-3 text-center">
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a49db8]">puntaje</dt>
            <dd className="score-display mt-0.5 text-lg">
              {profile ? profile.score.score.toFixed(2) : "3.50"}
            </dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a49db8]">recibidas</dt>
            <dd className="score-display mt-0.5 text-lg">{profile?.score.sampleSize ?? 0}</dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a49db8]">dadas</dt>
            <dd className="score-display mt-0.5 text-lg">{givenCount}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-between">
          <Link
            href={`/u/${user.handle}`}
            className="text-xs font-bold text-[#e8836b] underline underline-offset-4"
          >
            Ver mi perfil
          </Link>
          <LogoutButton />
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a49db8]">
          Tu perfil
        </h2>
        <p className="mb-3 mt-1.5 text-xs leading-relaxed text-[#6b6480]">
          Cómo te ven los demás. El usuario y el correo no se cambian desde aquí.
        </p>
        <ProfileForm
          displayName={user.displayName}
          bio={user.bio}
          avatarHue={user.avatarHue}
        />
      </section>

      <section className="panel p-5">
        <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a49db8]">
          Códigos de interacción
        </h2>
        <p className="mb-3 mt-1.5 text-xs leading-relaxed text-[#6b6480]">
          Un código por interacción real. Caduca en 24 h y sirve una sola vez. Tu nivel{" "}
          <span className="font-extrabold text-[#3b3550]">{tier.label}</span> te da{" "}
          <span className="font-extrabold text-[#3b3550]">{tier.dailyCodes}</span> al día.
        </p>

        <TokenForm baseUrl={baseUrl} />

        {tokens.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-[#f3eef6] pt-4">
            {tokens.map((t) => {
              const expired = t.expiresAt.getTime() < Date.now();
              const state = t.usedAt ? "usado" : expired ? "expirado" : "activo";
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[#faf7fb] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <code className="block truncate font-mono text-[11px] text-[#3b3550]">
                      /rate/{t.code}
                    </code>
                    <p className="truncate text-[11px] font-semibold text-[#a49db8]">
                      {t.note || "sin contexto"} · {timeAgo(t.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`pill shrink-0 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                      state === "activo"
                        ? "bg-[#cdebe0] text-[#2f6b57]"
                        : "bg-[#f3eef6] text-[#a49db8]"
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

      <section className="panel p-5">
        <h2 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a49db8]">
          Transparencia
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#6b6480]">
          Tus calificaciones son anónimas, pero tú puedes ver <em>cómo</em> se calcula tu número:
          estrellas, peso del votante y decay temporal. La fórmula vive en{" "}
          <code className="rounded bg-[#faf7fb] px-1.5 py-0.5 text-[#3b3550]">
            src/lib/reputation.ts
          </code>{" "}
          y no cambia sin un commit público.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#6b6480]">
          Las estrellas de tus publicaciones no suben tu reputación: son un número aparte.
        </p>
      </section>
    </div>
  );
}

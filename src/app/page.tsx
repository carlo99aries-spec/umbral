import Link from "next/link";
import { TIERS } from "@/lib/reputation";
import { TierBadge } from "@/components/TierBadge";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-24">
      {/* ---------------------------------------------------------- hero */}
      <section className="pt-10 text-center sm:pt-16">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          alpha abierta
        </p>

        <h1 className="mx-auto max-w-3xl text-balance text-5xl font-black leading-[0.95] tracking-tighter text-white sm:text-7xl">
          Todos te califican.
          <br />
          <span className="bg-gradient-to-r from-indigo-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
            Siempre.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg">
          Cada interacción en Umbral termina en una calificación de 1 a 5. Tu promedio no es una
          opinión: es una llave. Arriba de 4.5 se abre todo. Debajo de 3.0, el sistema te aparta.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {user ? (
            <Link
              href={`/u/${user.handle}`}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
            >
              Ver mi número
            </Link>
          ) : (
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
            >
              Crear cuenta
            </Link>
          )}
          <a
            href="#escalera"
            className="rounded-lg border border-zinc-800 px-6 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-600"
          >
            Ver la escalera
          </a>
        </div>

        <div className="mx-auto mt-14 max-w-sm">
          <div className="panel rounded-2xl p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Tu puntaje</p>
            <div className="score-display mt-2 text-6xl font-black text-white">4.18</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
              <div className="h-full w-[79%] rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400" />
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Te faltan <span className="text-zinc-300">0.32</span> para Platino. Y{" "}
              <span className="text-zinc-300">7</span> calificaciones.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- escalera */}
      <section id="escalera" className="scroll-mt-24">
        <SectionTitle eyebrow="El mecanismo" title="El número no es una opinión. Es una llave." />
        <div className="mt-8 grid gap-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="panel flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <TierBadge name={tier.name} label={tier.label} size="lg" />
                <div>
                  <p className="text-sm text-zinc-300">{tier.blurb}</p>
                  <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    {tier.privileges.map((p) => (
                      <li key={p}>· {p}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-lg text-zinc-200">{tier.minScore.toFixed(1)}+</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                  mín. {tier.minRatings} calif.
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- cómo funciona */}
      <section>
        <SectionTitle eyebrow="Tres pasos" title="Cómo se mueve un número" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Step
            n="01"
            title="Generas un código"
            body="Después de una interacción real, generas un enlace de un solo uso válido 24 horas. Sin código, nadie puede calificarte. Ni tu ex."
          />
          <Step
            n="02"
            title="La otra persona califica"
            body="De 1 a 5 estrellas, con una nota privada que solo ven los moderadores. Un código por persona, una calificación por mes."
          />
          <Step
            n="03"
            title="Su voto pesa lo que vales tú"
            body="Si quien te califica tiene 4.8, su opinión cuenta casi el doble que la de alguien con 3.0. Y tu voto cuenta menos si caes."
          />
        </div>
      </section>

      {/* ---------------------------------------------------------- honestidad */}
      <section className="panel rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-zinc-100">Lo que esto realmente es</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400">
          <p>
            Umbral nace de un episodio de <em>Black Mirror</em> que describe un mundo donde el
            afecto se vuelve transaccional. Lo construimos en abierto, con las reglas visibles en
            el código, precisamente para que se pueda auditar y discutir.
          </p>
          <p>
            Es una crítica funcional: un sistema que se puede usar, sentir y rechazar. No es un
            servicio de crédito social, no vende datos y no pretende evaluar personas reales más
            allá de este experimento.
          </p>
          <p className="text-zinc-500">
            Si eso te incomoda, perfecto. Esa incomodidad es el producto. Si aun así quieres
            construir la alternativa, el repositorio está abierto.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://github.com/carlo99aries-spec/umbral"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-600"
          >
            Ver el código
          </a>
          <Link
            href="/signup"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            Entrar al experimento
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">{title}</h2>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="panel rounded-xl p-5">
      <div className="font-mono text-xs text-indigo-400">{n}</div>
      <h3 className="mt-3 text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">{body}</p>
    </div>
  );
}

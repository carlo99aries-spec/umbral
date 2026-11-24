import Link from "next/link";
import { TIERS } from "@/lib/reputation";
import { TierBadge } from "@/components/TierBadge";

export const metadata = { title: "Por qué existe — Umbral" };

export default function AboutPage() {
  return (
    <div className="space-y-4">
      <section className="panel p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#a49db8]">
          Proyecto experimental
        </p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-[#3b3550]">
          Una crítica que se puede usar
        </h1>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#6b6480]">
          <p>
            Umbral nace de un episodio de <em>Black Mirror</em> donde el afecto se vuelve
            transaccional: todos califican a todos, y el número decide quién puede entrar a dónde.
          </p>
          <p>
            Construimos ese mecanismo de verdad, con el código abierto y la fórmula visible, porque
            una crítica que no se puede tocar se discute en abstracto y no convence a nadie.
          </p>
          <p>
            No es un servicio de crédito social. No vende datos. No pretende evaluar personas reales
            más allá de este experimento.
          </p>
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="text-sm font-extrabold text-[#3b3550]">La escalera</h2>
        <p className="mt-1 text-xs text-[#a49db8]">
          Los niveles no son insignias: son puertas.
        </p>
        <div className="mt-4 space-y-2">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[#faf7fb] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <TierBadge name={tier.name} label={tier.label} size="sm" />
                <span className="text-xs text-[#6b6480]">{tier.blurb}</span>
              </div>
              <span className="shrink-0 text-xs font-extrabold text-[#3b3550]">
                {tier.minScore.toFixed(1)}+
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="text-sm font-extrabold text-[#3b3550]">Dos números, no uno</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#6b6480]">
          <p>
            <strong className="text-[#3b3550]">Reputación</strong> viene solo de interacciones
            verificadas: alguien te da un código de un solo uso y te califica 1 a 5. Pesa distinto
            según quién califique y caduca con el tiempo.
          </p>
          <p>
            <strong className="text-[#3b3550]">Aura de contenido</strong> es lo que la gente opina
            de tus publicaciones. Se muestra aparte y no sube tu reputación, porque un feed que se
            puede inflar con likes destruiría el sistema entero.
          </p>
        </div>
      </section>

      <div className="flex gap-2 pb-2">
        <Link href="/" className="btn-primary flex-1 px-5 py-3 text-center text-sm">
          Ver el feed
        </Link>
        <a
          href="https://github.com/carlo99aries-spec/umbral"
          target="_blank"
          rel="noreferrer"
          className="btn-ghost flex-1 px-5 py-3 text-center text-sm"
        >
          Código fuente
        </a>
      </div>
    </div>
  );
}

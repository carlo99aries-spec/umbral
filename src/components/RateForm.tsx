"use client";

import { useActionState, useState } from "react";
import { rateAction, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

const LABELS: Record<number, string> = {
  1: "Insoportable",
  2: "Incómodo",
  3: "Correcto",
  4: "Buen momento",
  5: "Me encantó",
};

export function RateForm({ code, targetName }: { code: string; targetName: string }) {
  const [state, formAction, pending] = useActionState(rateAction, initial);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);

  const shown = hover || stars;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="stars" value={stars} />

      <p className="text-center text-sm text-[#6b6480]">
        ¿Cómo fue tu interacción con{" "}
        <span className="font-extrabold text-[#3b3550]">{targetName}</span>?
      </p>

      <div
        className="flex justify-center gap-1.5"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label="Calificación"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} estrellas`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setStars(n)}
            className={`text-5xl leading-none transition hover:-translate-y-0.5 ${
              shown >= n ? "text-[#f2b84b]" : "text-[#e6e1ee]"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <p className="h-5 text-center text-sm font-bold text-[#e8836b]">{LABELS[shown] ?? ""}</p>

      <label className="block">
        <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a49db8]">
          Nota privada (opcional)
        </span>
        <textarea
          name="note"
          rows={3}
          maxLength={280}
          placeholder="Solo la ven los moderadores. No se publica."
          className="field resize-none"
        />
      </label>

      {state.error && (
        <p className="rounded-2xl bg-[#f7d3dd] px-4 py-3 text-sm font-semibold text-[#8a4552]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || stars === 0}
        className="btn-primary w-full px-5 py-3.5 text-sm"
      >
        {pending ? "Enviando…" : stars === 0 ? "Elige una calificación" : "Enviar calificación"}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-[#a49db8]">
        El código es de un solo uso. Tu calificación pesa según tu propio número.
      </p>
    </form>
  );
}

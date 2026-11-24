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
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="stars" value={stars} />

      <div className="text-center">
        <p className="text-sm text-zinc-400">
          ¿Cómo fue tu interacción con <span className="text-zinc-100">{targetName}</span>?
        </p>
      </div>

      <div
        className="flex justify-center gap-2"
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
            className={`text-4xl leading-none transition hover:scale-110 ${
              shown >= n ? "text-amber-300" : "text-zinc-800"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <p className="h-5 text-center text-sm text-zinc-500">{LABELS[shown] ?? ""}</p>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Nota privada (opcional)
        </span>
        <textarea
          name="note"
          rows={3}
          maxLength={280}
          placeholder="Solo la ven los moderadores. No se publica."
          className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        />
      </label>

      {state.error && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || stars === 0}
        className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Enviando…" : stars === 0 ? "Elige una calificación" : "Enviar calificación"}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-zinc-600">
        El código es de un solo uso. Tu calificación pesa según tu propio número.
      </p>
    </form>
  );
}

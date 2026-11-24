"use client";

import { useActionState } from "react";
import { reportAction, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

const REASONS = [
  "Acoso o amenazas",
  "Discurso de odio",
  "Suplantación de identidad",
  "Manipulación de calificaciones",
  "Contenido sexual no consentido",
  "Otro",
];

export function ReportForm({ handle }: { handle: string }) {
  const [state, formAction, pending] = useActionState(reportAction, initial);

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs text-zinc-600 transition hover:text-zinc-400">
        Reportar este perfil
      </summary>
      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="handle" value={handle} />
        <select
          name="reason"
          required
          defaultValue=""
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
        >
          <option value="" disabled>
            Motivo…
          </option>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <textarea
          name="details"
          rows={2}
          maxLength={1000}
          placeholder="Detalles (opcional)"
          className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        />
        {state.error && <p className="text-xs text-red-400">{state.error}</p>}
        {state.success && <p className="text-xs text-emerald-400">{state.success}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 disabled:opacity-50"
        >
          {pending ? "Enviando…" : "Enviar reporte"}
        </button>
      </form>
    </details>
  );
}

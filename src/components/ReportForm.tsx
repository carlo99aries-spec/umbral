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
    <details>
      <summary className="cursor-pointer list-none text-center text-xs font-semibold text-[#c3bcd2] transition hover:text-[#6b6480]">
        Reportar este perfil
      </summary>
      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="handle" value={handle} />
        <select name="reason" required defaultValue="" className="field text-sm">
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
          className="field resize-none text-sm"
        />
        {state.error && <p className="text-xs font-semibold text-[#8a4552]">{state.error}</p>}
        {state.success && <p className="text-xs font-semibold text-[#2f6b57]">{state.success}</p>}
        <button type="submit" disabled={pending} className="btn-ghost w-full px-4 py-2 text-xs">
          {pending ? "Enviando…" : "Enviar reporte"}
        </button>
      </form>
    </details>
  );
}

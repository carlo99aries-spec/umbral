"use client";

import { useActionState } from "react";
import { createTokenAction, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export function TokenForm({ baseUrl }: { baseUrl: string }) {
  const [state, formAction, pending] = useActionState(createTokenAction, initial);

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <input
          name="note"
          maxLength={120}
          placeholder="¿Con quién fue? (ej. mesa 4, evento, junta)"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {pending ? "Generando…" : "Generar código"}
        </button>
      </form>

      {state.error && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      {state.success && (
        <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-3">
          <p className="text-xs uppercase tracking-wider text-emerald-400">Código válido 24 h</p>
          <code className="mt-1 block break-all font-mono text-sm text-emerald-200">
            {baseUrl}
            {state.success}
          </code>
        </div>
      )}
    </div>
  );
}

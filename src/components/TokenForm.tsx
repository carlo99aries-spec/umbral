"use client";

import { useActionState, useState } from "react";
import { createTokenAction, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export function TokenForm({ baseUrl }: { baseUrl: string }) {
  const [state, formAction, pending] = useActionState(createTokenAction, initial);
  const [copied, setCopied] = useState(false);

  const link = state.success ? `${baseUrl}${state.success}` : null;
  const qrSrc = link ? `/api/qr?data=${encodeURIComponent(link)}` : null;

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; the link is still visible to copy by hand */
    }
  }

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

      {link && (
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400">
            Código válido 24 h · un solo uso
          </p>

          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qrSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrSrc}
                alt="Código QR para calificar"
                width={176}
                height={176}
                className="rounded-lg bg-white p-2"
              />
            )}

            <div className="min-w-0 flex-1 space-y-2">
              <code className="block break-all rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-emerald-200">
                {link}
              </code>

              <p className="text-[11px] leading-relaxed text-zinc-500">
                Que la otra persona abra la cámara del teléfono y apunte al QR. No hace falta
                instalar nada más.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={copy}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500"
                >
                  {copied ? "Copiado ✓" : "Copiar enlace"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Te califico en Umbral: ${link}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500"
                >
                  Enviar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

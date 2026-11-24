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
    <div className="space-y-3">
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <input
          name="note"
          maxLength={120}
          placeholder="¿Con quién fue? (mesa 4, evento, junta…)"
          className="field flex-1 text-sm"
        />
        <button type="submit" disabled={pending} className="btn-primary shrink-0 px-5 py-2.5 text-sm">
          {pending ? "Generando…" : "Generar código"}
        </button>
      </form>

      {state.error && (
        <p className="rounded-2xl bg-[#f7d3dd] px-4 py-3 text-sm font-semibold text-[#8a4552]">
          {state.error}
        </p>
      )}

      {link && (
        <div className="rounded-3xl bg-[#cdebe0] p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#2f6b57]">
            Código válido 24 h · un solo uso
          </p>

          <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qrSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrSrc}
                alt="Código QR para calificar"
                width={168}
                height={168}
                className="rounded-2xl bg-white p-2 shadow-sm"
              />
            )}

            <div className="min-w-0 flex-1 space-y-2">
              <code className="block break-all rounded-xl bg-white/70 px-3 py-2 font-mono text-[11px] text-[#2f6b57]">
                {link}
              </code>

              <p className="text-[11px] font-semibold leading-relaxed text-[#3f7d68]">
                Que la otra persona apunte la cámara del teléfono al QR. No hace falta instalar
                nada más.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={copy}
                  className="pill bg-white px-3 py-1.5 text-xs font-bold text-[#2f6b57] shadow-sm transition hover:bg-white/80"
                >
                  {copied ? "Copiado ✓" : "Copiar enlace"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Te califico en Umbral: ${link}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="pill bg-white px-3 py-1.5 text-xs font-bold text-[#2f6b57] shadow-sm transition hover:bg-white/80"
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

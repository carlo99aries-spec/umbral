"use client";

import { useState, useTransition } from "react";
import { Star } from "./Star";
import { previewTokenAction, quickTokenAction, submitPersonRating } from "@/lib/actions";

type Step = "scan" | "rate" | "done";

const LABELS = ["", "Mal", "Regular", "Bien", "Muy bien", "Excelente"];

interface Target {
  displayName: string;
  handle: string;
  score: number;
}

interface Result {
  displayName: string;
  newScore: number;
  delta: number;
}

/**
 * "Calificar en persona" — the three steps from the mockup.
 *
 * Honest deviation from the mockup: a browser cannot do phone-to-phone NFC
 * (iOS Safari has no Web NFC at all, and even on Android it reads tags, not
 * another phone). The NFC tab explains that and routes people to the QR that
 * does work, which is the same primitive the rest of the app uses.
 */
export function PersonFlow({ baseUrl }: { baseUrl: string }) {
  const [step, setStep] = useState<Step>("scan");
  const [mode, setMode] = useState<"nfc" | "qr">("qr");

  const [typedCode, setTypedCode] = useState("");
  const [myCode, setMyCode] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);

  const [stars, setStars] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const myLink = myCode ? `${baseUrl}${myCode}` : null;

  function generateMine() {
    setError(null);
    start(async () => {
      const res = await quickTokenAction();
      if (res.ok && res.code) setMyCode(res.code);
      else setError(res.error ?? "No se pudo generar el código");
    });
  }

  function connect() {
    setError(null);
    start(async () => {
      const res = await previewTokenAction(typedCode);
      if (res.ok) {
        setTarget({ displayName: res.displayName, handle: res.handle, score: res.score });
        setStep("rate");
      } else {
        setError(res.error);
      }
    });
  }

  function send() {
    if (stars === 0) return;
    setError(null);
    start(async () => {
      const res = await submitPersonRating(typedCode, stars);
      if (res.ok) {
        setResult({ displayName: res.displayName, newScore: res.newScore, delta: res.delta });
        setStep("done");
      } else {
        setError(res.error);
      }
    });
  }

  function reset() {
    setStep("scan");
    setStars(0);
    setResult(null);
    setTarget(null);
    setTypedCode("");
    setError(null);
  }

  const primary =
    "w-full min-h-[52px] rounded-[18px] bg-[#3b3550] px-5 text-base font-extrabold text-white transition disabled:opacity-40";

  return (
    <div className="flex min-h-[70vh] flex-col gap-4">
      {step === "scan" && (
        <>
          <h1 className="text-[28px] font-extrabold tracking-tight">umbral</h1>

          <div className="flex gap-1.5 rounded-full bg-white p-1.5">
            <button
              type="button"
              onClick={() => setMode("nfc")}
              className={`min-h-11 flex-1 rounded-full text-[15px] font-extrabold transition ${
                mode === "nfc" ? "bg-[#f7d3dd]" : "bg-transparent text-[#6b6480]"
              }`}
            >
              Acercar (NFC)
            </button>
            <button
              type="button"
              onClick={() => setMode("qr")}
              className={`min-h-11 flex-1 rounded-full text-[15px] font-extrabold transition ${
                mode === "qr" ? "bg-[#f7d3dd]" : "bg-transparent text-[#6b6480]"
              }`}
            >
              Código QR
            </button>
          </div>

          <section className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[28px] bg-white p-6 text-center">
            {mode === "nfc" ? (
              <>
                <div className="grid h-[220px] w-[220px] place-items-center rounded-full bg-[#f7d3dd]">
                  <div className="grid h-[156px] w-[156px] place-items-center rounded-full bg-[#d6e8f7]">
                    <div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-[#cdebe0] text-[22px] font-extrabold">
                      NFC
                    </div>
                  </div>
                </div>
                <p className="text-[22px] font-extrabold leading-tight">
                  Acercar dos teléfonos no funciona en un navegador
                </p>
                <p className="text-[15px] leading-snug text-[#6b6480]">
                  iOS no expone NFC a las webs y Android solo lee etiquetas, no otro teléfono. El
                  código QR hace exactamente lo mismo y sí funciona: cambia de pestaña.
                </p>
                <button type="button" onClick={() => setMode("qr")} className={primary}>
                  Usar código QR
                </button>
              </>
            ) : (
              <>
                {myLink ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/qr?data=${encodeURIComponent(myLink)}`}
                      alt="Tu código QR"
                      width={198}
                      height={198}
                      className="rounded-[20px] bg-[#fdf1ec] p-3"
                    />
                    <p className="text-[22px] font-extrabold leading-tight">
                      Muéstrale este código
                    </p>
                    <p className="text-[15px] leading-snug text-[#6b6480]">
                      Que la otra persona lo apunte con la cámara del teléfono para calificarte.
                      Caduca en 24 h y sirve una sola vez.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="grid h-[198px] w-[198px] place-items-center rounded-[20px] bg-[#fdf1ec] text-4xl">
                      ⬚
                    </div>
                    <p className="text-[22px] font-extrabold leading-tight">Tu código de hoy</p>
                    <p className="text-[15px] leading-snug text-[#6b6480]">
                      Genera un código de un solo uso y muéstraselo a quien tengas enfrente.
                    </p>
                    <button type="button" onClick={generateMine} disabled={pending} className={primary}>
                      {pending ? "Generando…" : "Generar mi código"}
                    </button>
                  </>
                )}

                <div className="w-full border-t border-[#f3eef6] pt-4">
                  <p className="text-[13px] font-bold text-[#6b6480]">
                    ¿Te dieron un código? Pégalo aquí:
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={typedCode}
                      onChange={(e) => setTypedCode(e.target.value)}
                      placeholder="abc123… o el enlace completo"
                      className="field flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={connect}
                      disabled={pending || typedCode.trim().length < 4}
                      className="shrink-0 rounded-[18px] bg-[#3b3550] px-4 text-sm font-extrabold text-white disabled:opacity-40"
                    >
                      Conectar
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          {error && (
            <p className="rounded-2xl bg-[#f7d3dd] px-4 py-3 text-sm font-semibold text-[#8a4552]">
              {error}
            </p>
          )}
        </>
      )}

      {step === "rate" && target && (
        <>
          <p className="text-sm font-extrabold text-[#6b6480]">Conexión establecida</p>

          <section className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-[28px] bg-white p-6 text-center">
            <div className="grid h-[84px] w-[84px] place-items-center rounded-full bg-[#cdebe0] text-[28px] font-extrabold">
              {target.displayName
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("")}
            </div>
            <p className="text-2xl font-extrabold">{target.displayName}</p>
            <span className="rounded-full bg-[#fbe3a6] px-3.5 py-1.5 text-sm font-extrabold">
              Puntaje actual {target.score.toFixed(1)}
            </span>

            <p className="mt-3 text-[15px] text-[#6b6480]">¿Cómo fue tu encuentro?</p>

            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
                  className="grid h-[52px] w-[52px] place-items-center transition hover:scale-110"
                >
                  <Star size={44} filled={n <= stars} />
                </button>
              ))}
            </div>

            <p className="min-h-6 text-lg font-extrabold text-[#e8836b]">{LABELS[stars]}</p>
          </section>

          {error && (
            <p className="rounded-2xl bg-[#f7d3dd] px-4 py-3 text-sm font-semibold text-[#8a4552]">
              {error}
            </p>
          )}

          <button type="button" onClick={send} disabled={pending || stars === 0} className={primary}>
            {pending ? "Enviando…" : "Enviar calificación"}
          </button>
        </>
      )}

      {step === "done" && result && (
        <>
          <section className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[28px] bg-white p-6 text-center">
            <div className="grid h-[84px] w-[84px] place-items-center rounded-full bg-[#cdebe0] text-[40px]">
              ✓
            </div>
            <p className="text-2xl font-extrabold">Calificación enviada</p>
            <p className="text-[15px] leading-snug text-[#6b6480]">
              {result.displayName} recibió {stars} estrella{stars === 1 ? "" : "s"} de tu parte.
            </p>
            <p className="score-display mt-2 text-[64px] leading-none">
              {result.newScore.toFixed(1)}
            </p>
            <span className="rounded-full bg-[#f7d3dd] px-3.5 py-1.5 text-sm font-extrabold">
              {result.delta >= 0 ? "+" : ""}
              {result.delta.toFixed(2)} en su puntaje
            </span>
          </section>

          <button type="button" onClick={reset} className={primary}>
            Calificar a otra persona
          </button>
        </>
      )}
    </div>
  );
}

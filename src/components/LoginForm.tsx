"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-3.5">
      <label className="block">
        <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a49db8]">
          Usuario o correo
        </span>
        <input name="identifier" required autoComplete="username" className="field" />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a49db8]">
          Contraseña
        </span>
        <input name="password" type="password" required autoComplete="current-password" className="field" />
      </label>

      {state.error && (
        <p className="rounded-2xl bg-[#f7d3dd] px-4 py-3 text-sm font-semibold text-[#8a4552]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full px-5 py-3 text-sm">
        {pending ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-center text-xs font-semibold text-[#a49db8]">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="text-[#e8836b] underline underline-offset-4">
          Crea una
        </Link>
      </p>
    </form>
  );
}

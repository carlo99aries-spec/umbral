"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initial);

  return (
    <form action={formAction} className="space-y-3.5">
      <Field label="Nombre" name="displayName" placeholder="Lacie Pound" autoComplete="name" />
      <Field label="Usuario" name="handle" placeholder="lacie" autoComplete="username" prefix="@" />
      <Field
        label="Correo"
        name="email"
        type="email"
        placeholder="tu@correo.com"
        autoComplete="email"
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        placeholder="mínimo 8 caracteres"
        autoComplete="new-password"
      />

      {state.error && (
        <p className="rounded-2xl bg-[#f7d3dd] px-4 py-3 text-sm font-semibold text-[#8a4552]">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full px-5 py-3 text-sm">
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p className="text-center text-xs font-semibold text-[#a49db8]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#e8836b] underline underline-offset-4">
          Entra
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  prefix,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a49db8]">
        {label}
      </span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#c3bcd2]">
            {prefix}
          </span>
        )}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className={`field ${prefix ? "pl-8" : ""}`}
        />
      </div>
    </label>
  );
}

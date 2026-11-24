"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type ActionState } from "@/lib/actions";

const initial: ActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nombre" name="displayName" placeholder="Lacie Pound" autoComplete="name" />
      <Field
        label="Usuario"
        name="handle"
        placeholder="lacie"
        autoComplete="username"
        prefix="@"
      />
      <Field label="Correo" name="email" type="email" placeholder="tu@correo.com" autoComplete="email" />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        placeholder="mínimo 8 caracteres"
        autoComplete="new-password"
      />

      {state.error && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-zinc-300 underline underline-offset-4 hover:text-white">
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
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/80 focus-within:border-zinc-600">
        {prefix && <span className="pl-3 text-sm text-zinc-500">{prefix}</span>}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-100 outline-none"
        />
      </div>
    </label>
  );
}

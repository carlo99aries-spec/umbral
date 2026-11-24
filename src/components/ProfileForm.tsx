"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, type ActionState } from "@/lib/actions";
import { Avatar } from "@/components/Avatar";

const initial: ActionState = {};

const BIO_MAX = 280;

export function ProfileForm({
  displayName,
  bio,
  avatarHue,
}: {
  displayName: string;
  bio: string;
  avatarHue: number;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initial);

  // Controlled so the avatar preview follows the name and the slider live.
  const [name, setName] = useState(displayName);
  const [text, setText] = useState(bio);
  const [hue, setHue] = useState(avatarHue);

  return (
    <form action={formAction} className="space-y-3.5">
      <div className="flex items-center gap-4">
        <Avatar name={name || displayName} hue={hue} size={64} ring />
        <div className="min-w-0 flex-1">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a49db8]">
              Nombre
            </span>
            <input
              name="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={48}
              required
              className="field text-sm"
            />
          </label>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 flex items-baseline justify-between text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a49db8]">
          Bio
          <span className={`normal-case tracking-normal ${text.length > BIO_MAX ? "text-[#8a4552]" : ""}`}>
            {text.length}/{BIO_MAX}
          </span>
        </span>
        <textarea
          name="bio"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={BIO_MAX}
          placeholder="Una línea sobre ti. Nada de currículum."
          className="field resize-none text-sm leading-relaxed"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a49db8]">
          Color del avatar
        </span>
        <input
          type="range"
          name="avatarHue"
          min={0}
          max={359}
          value={hue}
          onChange={(e) => setHue(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: `hsl(${hue} 58% 62%)` }}
          aria-label="Matiz del avatar"
        />
      </label>

      {state.error && (
        <p className="rounded-2xl bg-[#f7d3dd] px-4 py-3 text-sm font-semibold text-[#8a4552]">
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="rounded-2xl bg-[#cdebe0] px-4 py-3 text-sm font-semibold text-[#2f6b57]"
        >
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full px-5 py-3 text-sm sm:w-auto"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

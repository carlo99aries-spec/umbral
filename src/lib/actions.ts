"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "./db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  normalizeHandle,
  verifyPassword,
} from "./auth";
import { isReciprocalPair, loadProfile, raterScoreSnapshot } from "./profile";
import { raterWeight, resolveTier } from "./reputation";

export type ActionState = { error?: string; success?: string };

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(48),
  handle: z
    .string()
    .trim()
    .transform(normalizeHandle)
    .refine((h) => h.length >= 3, "El usuario debe tener al menos 3 caracteres")
    .refine((h) => /^[a-z0-9][a-z0-9_.-]*$/.test(h), "Solo letras, números, punto, guion y guion bajo"),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    displayName: formData.get("displayName"),
    handle: formData.get("handle"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  const { displayName, handle, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ handle }, { email }] },
    select: { handle: true, email: true },
  });

  if (existing) {
    return {
      error:
        existing.email === email
          ? "Ya existe una cuenta con ese correo"
          : "Ese nombre de usuario ya está tomado",
    };
  }

  const user = await prisma.user.create({
    data: {
      displayName,
      handle,
      email,
      passwordHash: await hashPassword(password),
      avatarHue: crypto.randomInt(0, 360),
    },
  });

  await createSession(user.id);
  redirect(`/u/${user.handle}`);
}

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Escribe tu usuario o correo"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  const id = parsed.data.identifier;
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: id.toLowerCase() }, { handle: normalizeHandle(id) }] },
  });

  // Same message for unknown user and bad password: no account enumeration.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Usuario o contraseña incorrectos" };
  }
  if (user.suspended) {
    return { error: "Esta cuenta está suspendida" };
  }

  await createSession(user.id);
  redirect(`/u/${user.handle}`);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

/**
 * Issue a single-use interaction code. You hand it to someone you actually
 * interacted with; they use it to rate you. Without a code, no rating.
 */
export async function createTokenAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await loadProfile(user.handle);
  const tier = profile
    ? resolveTier(profile.score.score, profile.score.sampleSize)
    : resolveTier(3.5, 0);

  const dailyLimit = tier.dailyCodes;

  const since = new Date(Date.now() - 86_400_000);
  const issuedToday = await prisma.interactionToken.count({
    where: { issuerId: user.id, createdAt: { gte: since } },
  });

  if (issuedToday >= dailyLimit) {
    return { error: `Tu nivel permite ${dailyLimit} código(s) de interacción al día.` };
  }

  const note = String(formData.get("note") ?? "").slice(0, 120);
  const code = crypto.randomBytes(5).toString("hex");

  await prisma.interactionToken.create({
    data: {
      code,
      issuerId: user.id,
      note,
      expiresAt: new Date(Date.now() + 24 * 3_600_000),
    },
  });

  revalidatePath("/settings");
  return { success: `/rate/${code}` };
}

const rateSchema = z.object({
  code: z.string().min(4),
  stars: z.coerce.number().int().min(1).max(5),
  note: z.string().trim().max(280).optional().default(""),
});

/** Apply a rating through an interaction code. */
export async function rateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const rater = await getCurrentUser();
  if (!rater) redirect("/login");

  const parsed = rateSchema.safeParse({
    code: formData.get("code"),
    stars: formData.get("stars"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Calificación inválida" };
  }

  const { code, stars, note } = parsed.data;

  const token = await prisma.interactionToken.findUnique({
    where: { code },
    include: { issuer: true },
  });

  if (!token) return { error: "Código inválido" };
  if (token.usedAt) return { error: "Este código ya se usó" };
  if (token.expiresAt.getTime() < Date.now()) return { error: "Este código expiró" };
  if (token.issuerId === rater.id) return { error: "No puedes calificarte a ti mismo" };

  // One rating per subject per 30 days.
  const recent = await prisma.rating.findFirst({
    where: {
      raterId: rater.id,
      subjectId: token.issuerId,
      createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
    },
  });
  if (recent) return { error: "Ya calificaste a esta persona este mes" };

  const reciprocal = await isReciprocalPair(rater.id, token.issuerId, stars);
  const raterScore = await raterScoreSnapshot(rater.id);

  await prisma.$transaction([
    prisma.rating.create({
      data: {
        raterId: rater.id,
        subjectId: token.issuerId,
        stars,
        note,
        raterScore,
        weight: raterWeight(raterScore) * (reciprocal ? 0.35 : 1),
        reciprocal,
      },
    }),
    prisma.interactionToken.update({
      where: { id: token.id },
      data: { usedAt: new Date(), usedById: rater.id },
    }),
  ]);

  revalidatePath(`/u/${token.issuer.handle}`);
  redirect(`/u/${token.issuer.handle}?rated=1`);
}

/** Report a profile. Stored, not auto-actioned. */
export async function reportAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const reporter = await getCurrentUser();
  if (!reporter) redirect("/login");

  const handle = String(formData.get("handle") ?? "");
  const reason = String(formData.get("reason") ?? "").slice(0, 120);
  const details = String(formData.get("details") ?? "").slice(0, 1000);

  if (!reason) return { error: "Elige un motivo" };

  const subject = await prisma.user.findUnique({ where: { handle } });
  if (!subject) return { error: "Perfil no encontrado" };
  if (subject.id === reporter.id) return { error: "No puedes reportarte a ti mismo" };

  const already = await prisma.report.findFirst({
    where: { reporterId: reporter.id, subjectId: subject.id, resolved: false },
  });
  if (already) return { success: "Ya tienes un reporte abierto contra este perfil" };

  await prisma.report.create({
    data: { reporterId: reporter.id, subjectId: subject.id, reason, details },
  });

  return { success: "Reporte registrado. Un moderador lo revisará." };
}

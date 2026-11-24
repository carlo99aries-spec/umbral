import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { User } from "@prisma/client";
import { prisma } from "./db";

export const SESSION_COOKIE = "umbral_session";
const SESSION_DAYS = 30;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string, userAgent = ""): Promise<void> {
  const id = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await prisma.session.create({ data: { id, userId, expiresAt, userAgent } });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    await prisma.session.deleteMany({ where: { id } });
  }
  jar.delete(SESSION_COOKIE);
}

/** Full user row (includes passwordHash — never send this to the client). */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.deleteMany({ where: { id } });
    return null;
  }
  if (session.user.suspended) return null;

  return session.user;
}

/** Safe projection for anything crossing the client boundary. */
export type PublicUser = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarHue: number;
  createdAt: Date;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    bio: user.bio,
    avatarHue: user.avatarHue,
    createdAt: user.createdAt,
  };
}

export function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_.-]/g, "")
    .slice(0, 24);
}

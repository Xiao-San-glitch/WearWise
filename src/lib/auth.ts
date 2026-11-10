import { cookies } from "next/headers";
import { findUserById, findUserByEmail } from "./db";
import { createSessionToken, readSessionToken, verifyPassword } from "./crypto";
import type { User } from "./types";

export const SESSION_COOKIE = "ww_session";

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  const uid = readSessionToken(raw);
  if (!uid) return null;
  const user = findUserById(uid);
  return user ? toPublicUser(user) : null;
}

export async function requireUser(): Promise<PublicUser | null> {
  return getSessionUser();
}

export async function requireAdmin(): Promise<PublicUser | null> {
  const user = await getSessionUser();
  return user && user.role === "admin" ? user : null;
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: PublicUser } | { error: string }> {
  const user = findUserByEmail(email);
  if (!user) return { error: "No account found with that email." };
  if (!verifyPassword(password, user.passwordHash)) {
    return { error: "That password doesn't match our records." };
  }
  const token = createSessionToken(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { user: toPublicUser(user) };
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

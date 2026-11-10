import { NextResponse } from "next/server";
import { mutateDb } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";

export async function POST(request: Request) {
  let body: { token?: string; email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { token, email, password } = body;
  if (!token || !email || !password) {
    return NextResponse.json({ error: "Missing reset details." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const result = mutateDb((db) => {
    const reset = db.passwordResets.find(
      (entry) => entry.token === token && entry.email.toLowerCase() === email.toLowerCase(),
    );
    if (!reset || new Date(reset.expiresAt).getTime() < Date.now()) {
      return { ok: false as const, error: "This reset link is invalid or has expired." };
    }
    const user = db.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (!user) return { ok: false as const, error: "Account not found." };
    user.passwordHash = hashPassword(password);
    db.passwordResets = db.passwordResets.filter((entry) => entry.token !== token);
    return { ok: true as const };
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ message: "Password updated. You can sign in now." });
}

import { NextResponse } from "next/server";
import { mutateDb, findUserByEmail } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { signIn, toPublicUser } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json(
      { error: "An account with that email already exists. Try signing in." },
      { status: 409 },
    );
  }

  const user = mutateDb((db) => {
    const entry: User = {
      id: `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name,
      email,
      passwordHash: hashPassword(password),
      role: "user",
      createdAt: new Date().toISOString(),
      preferences: {
        audience: "",
        budget: "",
        occasion: "",
        style: "",
        colors: [],
        season: "",
        fit: "",
      },
    };
    db.users.push(entry);
    return entry;
  });

  const result = await signIn(email, password);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}

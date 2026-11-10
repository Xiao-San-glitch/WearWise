import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { findUserByEmail, mutateDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const user = findUserByEmail(email);
  const genericMessage =
    "If an account exists with that email, a reset link has been generated. In this demo the link appears below instead of being emailed.";

  if (!user) {
    return NextResponse.json({ message: genericMessage });
  }

  const token = crypto.randomBytes(24).toString("base64url");
  mutateDb((db) => {
    db.passwordResets = db.passwordResets.filter((reset) => reset.email !== email);
    db.passwordResets.push({
      token,
      email,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  });

  const origin = request.nextUrl.origin;
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  return NextResponse.json({
    message: genericMessage,
    // No mail provider is configured in the demo, so the link is returned
    // directly. In production, email this link and never include it here.
    resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
  });
}

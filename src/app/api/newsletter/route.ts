import { NextResponse } from "next/server";
import { mutateDb } from "@/lib/db";
import { randomId } from "@/lib/crypto";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const already = mutateDb((db) => {
    if (db.newsletter.some((entry) => entry.email === email)) return true;
    db.newsletter.push({ id: randomId("nl"), email, createdAt: new Date().toISOString() });
    return false;
  });

  return NextResponse.json({
    message: already ? "You're already on the list." : "You're on the list — welcome to WearWise.",
  });
}

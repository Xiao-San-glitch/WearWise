import { NextResponse } from "next/server";
import { mutateDb } from "@/lib/db";
import { randomId } from "@/lib/crypto";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const subject = (body.subject ?? "").trim() || "General enquiry";
  const message = (body.message ?? "").trim();

  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Please add a little more detail (10+ characters)." }, { status: 400 });
  }

  mutateDb((db) => {
    db.contacts.unshift({
      id: randomId("msg"),
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
    });
  });

  return NextResponse.json({
    message: "Thanks — your message is in. We usually reply within one working day.",
  });
}

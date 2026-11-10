import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const result = await signIn(body.email, body.password);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json({ user: result.user });
}

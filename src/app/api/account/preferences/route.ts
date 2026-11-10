import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { mutateDb } from "@/lib/db";
import type { Audience, Fit } from "@/lib/types";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: {
    name?: string;
    preferences?: {
      audience?: string;
      budget?: string;
      occasion?: string;
      style?: string;
      colors?: string[];
      season?: string;
      fit?: string;
    };
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (name && name.length < 2) {
    return NextResponse.json({ error: "Name is too short." }, { status: 400 });
  }

  const updated = mutateDb((db) => {
    const stored = db.users.find((entry) => entry.id === user.id);
    if (!stored) return null;
    if (name) stored.name = name;
    if (body.preferences) {
      const prefs = body.preferences;
      stored.preferences = {
        audience: ["men", "women", "unisex"].includes(prefs.audience ?? "")
          ? (prefs.audience as Audience)
          : "",
        budget: String(prefs.budget ?? "").slice(0, 20),
        occasion: String(prefs.occasion ?? "").slice(0, 30),
        style: String(prefs.style ?? "").slice(0, 30),
        colors: Array.isArray(prefs.colors) ? prefs.colors.slice(0, 6) : [],
        season: String(prefs.season ?? "").slice(0, 30),
        fit: ["slim", "regular", "oversized"].includes(prefs.fit ?? "") ? (prefs.fit as Fit) : "",
      };
    }
    return stored;
  });

  if (!updated) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  return NextResponse.json({ ok: true, preferences: updated.preferences, name: updated.name });
}

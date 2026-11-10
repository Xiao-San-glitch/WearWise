import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getWardrobePlannerForUser, mutateDb } from "@/lib/db";
import { randomId } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to plan outfits." }, { status: 401 });
  return NextResponse.json({ entries: getWardrobePlannerForUser(user.id) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to plan outfits." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const date = String(body.date ?? "");
  if (!ISO_DATE.test(date) || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
    return NextResponse.json({ error: "Choose a valid date." }, { status: 400 });
  }
  const outfitId = String(body.outfitId ?? "");
  const note = String(body.note ?? "").slice(0, 120);

  const entry = mutateDb((db) => {
    const outfit = db.wardrobeOutfits.find(
      (candidate) => candidate.id === outfitId && candidate.userId === user.id,
    );
    if (!outfit) return null;
    const existing = db.wardrobePlanner.find(
      (candidate) => candidate.userId === user.id && candidate.date === date,
    );
    if (existing) {
      existing.outfitId = outfitId;
      existing.note = note;
      return existing;
    }
    const created = {
      id: randomId("plan"),
      userId: user.id,
      date,
      outfitId,
      note,
      createdAt: new Date().toISOString(),
    };
    db.wardrobePlanner.push(created);
    return created;
  });

  if (!entry) return NextResponse.json({ error: "Save that outfit first, then plan it." }, { status: 400 });
  return NextResponse.json({ entry, entries: getWardrobePlannerForUser(user.id) }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to plan outfits." }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const date = url.searchParams.get("date");
  if (!id && !date) return NextResponse.json({ error: "Missing planner entry." }, { status: 400 });

  mutateDb((db) => {
    db.wardrobePlanner = db.wardrobePlanner.filter((entry) => {
      if (entry.userId !== user.id) return true;
      if (id && entry.id === id) return false;
      if (date && entry.date === date) return false;
      return true;
    });
  });

  return NextResponse.json({ entries: getWardrobePlannerForUser(user.id) });
}

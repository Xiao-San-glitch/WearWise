import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, mutateDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit saved outfits." }, { status: 401 });
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const existing = getDb().wardrobeOutfits.find(
    (outfit) => outfit.id === id && outfit.userId === user.id,
  );
  if (!existing) return NextResponse.json({ error: "Outfit not found." }, { status: 404 });

  const patch: { favorite?: boolean; collectionId?: string | null; title?: string } = {};
  if (typeof body.favorite === "boolean") patch.favorite = body.favorite;
  if (typeof body.title === "string") {
    const title = body.title.trim().slice(0, 90);
    if (title.length < 2) return NextResponse.json({ error: "Give the outfit a title." }, { status: 400 });
    patch.title = title;
  }
  if ("collectionId" in body) {
    const collectionId = body.collectionId ? String(body.collectionId) : null;
    if (collectionId) {
      const owned = getDb().wardrobeCollections.some(
        (collection) => collection.id === collectionId && collection.userId === user.id,
      );
      if (!owned) return NextResponse.json({ error: "That collection doesn't exist." }, { status: 400 });
    }
    patch.collectionId = collectionId;
  }

  const updated = mutateDb((db) => {
    const outfit = db.wardrobeOutfits.find(
      (entry) => entry.id === id && entry.userId === user.id,
    );
    if (!outfit) return null;
    Object.assign(outfit, patch);
    return outfit;
  });

  if (!updated) return NextResponse.json({ error: "Outfit not found." }, { status: 404 });
  return NextResponse.json({ outfit: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit saved outfits." }, { status: 401 });
  const { id } = await params;

  let removed = false;
  mutateDb((db) => {
    const before = db.wardrobeOutfits.length;
    db.wardrobeOutfits = db.wardrobeOutfits.filter(
      (outfit) => !(outfit.id === id && outfit.userId === user.id),
    );
    db.wardrobePlanner = db.wardrobePlanner.filter(
      (entry) => !(entry.outfitId === id && entry.userId === user.id),
    );
    removed = db.wardrobeOutfits.length !== before;
  });

  if (!removed) return NextResponse.json({ error: "Outfit not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

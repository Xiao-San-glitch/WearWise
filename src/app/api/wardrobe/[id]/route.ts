import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { mutateDb } from "@/lib/db";
import { validateWardrobeItem } from "@/lib/wardrobe";

export const dynamic = "force-dynamic";

async function ownedItem(userId: string, id: string) {
  const { getDb } = await import("@/lib/db");
  return getDb().wardrobe.find((item) => item.id === id && item.userId === userId);
}

async function removeUpload(userId: string, image: string) {
  if (!image.startsWith(`/uploads/wardrobe/${userId}/`)) return;
  const relative = image.replace(/^\//, "");
  const target = path.join(process.cwd(), "public", relative);
  const root = path.join(process.cwd(), "public", "uploads", "wardrobe", userId);
  if (!target.startsWith(root)) return;
  await fs.unlink(target).catch(() => undefined);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit your closet." }, { status: 401 });
  const { id } = await params;
  const existing = await ownedItem(user.id, id);
  if (!existing) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = validateWardrobeItem(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const updated = mutateDb((db) => {
    const item = db.wardrobe.find((entry) => entry.id === id && entry.userId === user.id);
    if (!item) return null;
    Object.assign(item, parsed.value);
    return item;
  });

  if (!updated) return NextResponse.json({ error: "Item not found." }, { status: 404 });
  if (existing.image && existing.image !== parsed.value.image) {
    await removeUpload(user.id, existing.image);
  }
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit your closet." }, { status: 401 });
  const { id } = await params;
  const existing = await ownedItem(user.id, id);
  if (!existing) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  mutateDb((db) => {
    db.wardrobe = db.wardrobe.filter((item) => !(item.id === id && item.userId === user.id));
    db.wardrobeOutfits = db.wardrobeOutfits.map((outfit) => {
      if (outfit.userId !== user.id || !outfit.itemIds.includes(id)) return outfit;
      const itemIds = outfit.itemIds.filter((itemId) => itemId !== id);
      const total = itemIds.reduce(
        (sum, itemId) => sum + (db.wardrobe.find((item) => item.id === itemId)?.price ?? 0),
        0,
      );
      return { ...outfit, itemIds, total };
    });
    // Saved looks left without pieces are no longer useful.
    db.wardrobeOutfits = db.wardrobeOutfits.filter(
      (outfit) => outfit.userId !== user.id || outfit.itemIds.length > 0,
    );
    const valid = new Set(db.wardrobeOutfits.map((outfit) => outfit.id));
    db.wardrobePlanner = db.wardrobePlanner.filter(
      (entry) => entry.userId !== user.id || valid.has(entry.outfitId),
    );
  });

  await removeUpload(user.id, existing.image);
  return NextResponse.json({ ok: true });
}

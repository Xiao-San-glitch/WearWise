import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, getWardrobeForUser, mutateDb } from "@/lib/db";
import { randomId } from "@/lib/crypto";
import { scoreWardrobeOutfit } from "@/lib/wardrobe";
import {
  WARDROBE_OCCASIONS,
  WARDROBE_SEASONS,
  WARDROBE_STYLES,
} from "@/lib/wardrobe";
import type { WardrobeItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to see saved outfits." }, { status: 401 });

  const wardrobe = getWardrobeForUser(user.id);
  const byId = new Map(wardrobe.map((item) => [item.id, item]));
  const outfits = getDb()
    .wardrobeOutfits.filter((outfit) => outfit.userId === user.id)
    .map((outfit) => {
      const items = outfit.itemIds
        .map((id) => byId.get(id))
        .filter((item): item is WardrobeItem => Boolean(item));
      return { ...outfit, items, gaps: [], score: scoreWardrobeOutfit(items, outfit) };
    });

  return NextResponse.json({ outfits });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to save outfits." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ids = Array.isArray(body.itemIds) ? body.itemIds.map(String).slice(0, 10) : [];
  if (!ids.length) return NextResponse.json({ error: "This outfit has no pieces to save." }, { status: 400 });

  const wardrobe = getWardrobeForUser(user.id);
  const items = ids
    .map((id) => wardrobe.find((item) => item.id === id))
    .filter((item): item is WardrobeItem => Boolean(item));
  if (!items.length) {
    return NextResponse.json({ error: "None of these pieces are in your wardrobe." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim().slice(0, 90);
  if (title.length < 2) return NextResponse.json({ error: "Give the outfit a title." }, { status: 400 });

  const occasion = String(body.occasion ?? "Casual");
  const style = String(body.style ?? "Minimal");
  const season = String(body.season ?? "All-season");
  if (!(WARDROBE_OCCASIONS as readonly string[]).includes(occasion)) {
    return NextResponse.json({ error: "Choose a valid occasion." }, { status: 400 });
  }
  if (!(WARDROBE_STYLES as readonly string[]).includes(style)) {
    return NextResponse.json({ error: "Choose a valid style." }, { status: 400 });
  }
  if (!(WARDROBE_SEASONS as readonly string[]).includes(season)) {
    return NextResponse.json({ error: "Choose a valid season." }, { status: 400 });
  }

  const collectionId = body.collectionId ? String(body.collectionId) : null;
  if (collectionId) {
    const owned = getDb().wardrobeCollections.some(
      (collection) => collection.id === collectionId && collection.userId === user.id,
    );
    if (!owned) return NextResponse.json({ error: "That collection doesn't exist." }, { status: 400 });
  }

  const outfit = {
    id: randomId("wlook"),
    userId: user.id,
    title,
    description: String(body.description ?? "").slice(0, 400),
    itemIds: items.map((item) => item.id),
    occasion,
    style,
    season,
    total: items.reduce((sum, item) => sum + item.price, 0),
    why: String(body.why ?? "").slice(0, 800),
    suitability: String(body.suitability ?? "").slice(0, 120),
    tips: String(body.tips ?? "").slice(0, 500),
    favorite: Boolean(body.favorite),
    collectionId,
    createdAt: new Date().toISOString(),
  };

  mutateDb((db) => {
    db.wardrobeOutfits.unshift(outfit);
  });

  return NextResponse.json(
    { outfit: { ...outfit, items, gaps: [], score: scoreWardrobeOutfit(items, outfit) } },
    { status: 201 },
  );
}

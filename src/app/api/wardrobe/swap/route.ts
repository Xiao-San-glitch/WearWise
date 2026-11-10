import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getWardrobeForUser } from "@/lib/db";
import {
  describeWardrobeOutfit,
  normalizePreferences,
  slotOf,
  swapOutfitItem,
} from "@/lib/wardrobe";
import type { GeneratedWardrobeOutfit, WardrobeItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to edit outfits." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const preferences = normalizePreferences(body.preferences);
  const itemId = String(body.itemId ?? "");
  const excludeIds = Array.isArray(body.excludeIds) ? body.excludeIds.map(String).slice(0, 20) : [];
  const rawItems = Array.isArray(body.items) ? body.items : [];

  const wardrobe = getWardrobeForUser(user.id);
  const outfitItems = rawItems
    .map((raw) => {
      const id = typeof raw === "string" ? raw : String((raw as { id?: string })?.id ?? "");
      return wardrobe.find((item) => item.id === id);
    })
    .filter((item): item is WardrobeItem => Boolean(item));

  if (!outfitItems.length) return NextResponse.json({ error: "That outfit is no longer available." }, { status: 400 });

  const outfit = {
    id: "swap",
    title: String(body.title ?? "Outfit"),
    description: "",
    occasion: preferences.occasion,
    style: preferences.style,
    season: preferences.season,
    items: outfitItems,
    itemIds: outfitItems.map((item) => item.id),
    total: outfitItems.reduce((sum, item) => sum + item.price, 0),
    why: "",
    suitability: "",
    tips: "",
    gaps: [],
    score: 0,
  } satisfies GeneratedWardrobeOutfit;

  const replacementId = body.replacementId ? String(body.replacementId) : "";
  if (replacementId) {
    const replacement = wardrobe.find((item) => item.id === replacementId);
    const current = outfitItems.find((item) => item.id === itemId);
    if (!replacement) return NextResponse.json({ error: "That piece is not in your wardrobe." }, { status: 400 });
    if (!current) return NextResponse.json({ error: "That piece is not part of this look." }, { status: 400 });
    if (slotOf(replacement.category) !== slotOf(current.category)) {
      return NextResponse.json({ error: "Choose a piece from the same category slot." }, { status: 400 });
    }
    if (outfitItems.some((item) => item.id === replacement.id)) {
      return NextResponse.json({ error: "That piece is already in this look." }, { status: 409 });
    }
  }

  const result = replacementId
    ? { item: wardrobe.find((item) => item.id === replacementId) }
    : swapOutfitItem(outfit, itemId, wardrobe, preferences, excludeIds);
  if (!result.item) {
    return NextResponse.json({ error: result.error ?? "No alternative is available." }, { status: 400 });
  }

  const nextItems = outfitItems.map((item) => (item.id === itemId ? result.item! : item));
  const total = nextItems.reduce((sum, item) => sum + item.price, 0);
  const description = describeWardrobeOutfit(nextItems, preferences);

  return NextResponse.json({
    item: result.item,
    items: nextItems.map((item) => item.id),
    total,
    score: description.score,
    description: description.description,
    why: description.why,
    suitability: description.suitability,
    tips: description.tips,
  });
}

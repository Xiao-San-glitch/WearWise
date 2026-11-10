import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getWardrobeForUser } from "@/lib/db";
import { generateWardrobeOutfits, normalizePreferences } from "@/lib/wardrobe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to generate outfits." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const input = (body ?? {}) as { preferences?: unknown; seed?: unknown };
  const preferences = normalizePreferences(input.preferences);
  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) : Date.now();

  const wardrobe = getWardrobeForUser(user.id);
  if (!wardrobe.length) {
    return NextResponse.json(
      { error: "Add a few pieces to your closet first — outfits are built only from what you own." },
      { status: 400 },
    );
  }

  const result = generateWardrobeOutfits(wardrobe, preferences, seed);
  return NextResponse.json({
    outfits: result.outfits,
    gaps: result.gaps,
    preferences,
    wardrobeCount: wardrobe.length,
  });
}

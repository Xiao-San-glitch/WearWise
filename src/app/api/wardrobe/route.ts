import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { mutateDb, getWardrobeForUser } from "@/lib/db";
import { randomId } from "@/lib/crypto";
import { validateWardrobeItem, wardrobeStats } from "@/lib/wardrobe";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to open your closet." }, { status: 401 });
  const items = getWardrobeForUser(user.id);
  return NextResponse.json({ items, stats: wardrobeStats(items) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to add wardrobe items." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = validateWardrobeItem(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const item = {
    id: randomId("wi"),
    userId: user.id,
    ...parsed.value,
    createdAt: new Date().toISOString(),
  };

  mutateDb((db) => {
    db.wardrobe.unshift(item);
  });

  return NextResponse.json({ item }, { status: 201 });
}

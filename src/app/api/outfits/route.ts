import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProducts, mutateDb } from "@/lib/db";
import { randomId } from "@/lib/crypto";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const outfits = mutateDb((db) => db.outfits.filter((outfit) => outfit.userId === user.id));
  return NextResponse.json({ outfits });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to save looks." }, { status: 401 });

  let body: { title?: string; productIds?: string[]; explanation?: string; preferences?: Record<string, unknown> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ids = Array.isArray(body.productIds) ? body.productIds.slice(0, 8) : [];
  const products = getProducts();
  const items = ids
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
  if (!items.length) return NextResponse.json({ error: "No valid products in this look." }, { status: 400 });

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const outfit = {
    id: randomId("look"),
    userId: user.id,
    title: String(body.title ?? "Saved look").slice(0, 80),
    productIds: items.map((item) => item.id),
    total,
    explanation: String(body.explanation ?? "").slice(0, 800),
    preferences: body.preferences ?? {},
    createdAt: new Date().toISOString(),
  };

  mutateDb((db) => {
    db.outfits.unshift(outfit);
  });

  return NextResponse.json({ outfit }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing outfit id." }, { status: 400 });

  mutateDb((db) => {
    db.outfits = db.outfits.filter((outfit) => !(outfit.id === id && outfit.userId === user.id));
  });
  return NextResponse.json({ ok: true });
}

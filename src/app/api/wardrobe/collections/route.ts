import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getWardrobeCollectionsForUser, mutateDb } from "@/lib/db";
import { randomId } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage collections." }, { status: 401 });
  return NextResponse.json({ collections: getWardrobeCollectionsForUser(user.id) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage collections." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 50);
  if (name.length < 2) return NextResponse.json({ error: "Name the collection." }, { status: 400 });
  const description = String(body.description ?? "").trim().slice(0, 160);

  const collection = {
    id: randomId("wcol"),
    userId: user.id,
    name,
    description,
    createdAt: new Date().toISOString(),
  };

  mutateDb((db) => {
    db.wardrobeCollections.unshift(collection);
  });

  return NextResponse.json({ collection }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage collections." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = String(body.id ?? "");
  const name = String(body.name ?? "").trim().slice(0, 50);
  if (!id) return NextResponse.json({ error: "Missing collection." }, { status: 400 });
  if (name.length < 2) return NextResponse.json({ error: "Name the collection." }, { status: 400 });

  const updated = mutateDb((db) => {
    const collection = db.wardrobeCollections.find(
      (entry) => entry.id === id && entry.userId === user.id,
    );
    if (!collection) return null;
    collection.name = name;
    if (typeof body.description === "string") {
      collection.description = body.description.trim().slice(0, 160);
    }
    return collection;
  });

  if (!updated) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  return NextResponse.json({ collection: updated });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage collections." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing collection." }, { status: 400 });

  let removed = false;
  mutateDb((db) => {
    const before = db.wardrobeCollections.length;
    db.wardrobeCollections = db.wardrobeCollections.filter(
      (collection) => !(collection.id === id && collection.userId === user.id),
    );
    db.wardrobeOutfits = db.wardrobeOutfits.map((outfit) =>
      outfit.userId === user.id && outfit.collectionId === id
        ? { ...outfit, collectionId: null }
        : outfit,
    );
    removed = db.wardrobeCollections.length !== before;
  });

  if (!removed) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

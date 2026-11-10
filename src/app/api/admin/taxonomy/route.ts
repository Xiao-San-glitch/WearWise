import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mutateDb } from "@/lib/db";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  let body: { type?: string; name?: string; image?: string; blurb?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const type = body.type;
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const result = mutateDb((db) => {
    if (type === "brand") {
      if (db.brands.some((brand) => brand.toLowerCase() === name.toLowerCase())) {
        return { error: "That brand already exists." };
      }
      db.brands.push(name);
      return { ok: true };
    }
    if (type === "category") {
      if (db.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
        return { error: "That category already exists." };
      }
      db.categories.push({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        image: body.image?.trim() || "/products/8148576.jpg",
        blurb: body.blurb?.trim() || "A new addition to the catalogue.",
      });
      return { ok: true };
    }
    return { error: "Unknown taxonomy type." };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const name = url.searchParams.get("name")?.trim();
  if (!type || !name) return NextResponse.json({ error: "Missing parameters." }, { status: 400 });

  const result = mutateDb((db) => {
    if (type === "brand") {
      if (db.products.some((product) => product.brand === name)) {
        return { error: "Brand is used by existing products. Reassign them first." };
      }
      db.brands = db.brands.filter((brand) => brand !== name);
      return { ok: true };
    }
    if (type === "category") {
      if (db.products.some((product) => product.category === name)) {
        return { error: "Category is used by existing products. Reassign them first." };
      }
      db.categories = db.categories.filter((category) => category.name !== name);
      return { ok: true };
    }
    return { error: "Unknown taxonomy type." };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

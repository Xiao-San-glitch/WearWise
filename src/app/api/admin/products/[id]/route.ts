import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mutateDb } from "@/lib/db";
import { normalizeProductInput, type ProductInput } from "@/lib/product-input";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await params;
  let body: ProductInput;
  try {
    body = (await request.json()) as ProductInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const normalized = normalizeProductInput(body);
  if (!normalized.ok) return NextResponse.json({ error: normalized.error }, { status: 400 });

  const result = mutateDb((db) => {
    const product = db.products.find((entry) => entry.id === id);
    if (!product) return null;
    const slugTaken = db.products.some(
      (entry) => entry.id !== id && entry.slug === normalized.value.slug,
    );
    Object.assign(product, normalized.value, {
      slug: slugTaken ? `${normalized.value.slug}-${id}` : normalized.value.slug,
    });
    if (!db.brands.includes(product.brand)) db.brands.push(product.brand);
    if (!db.categories.some((category) => category.name === product.category)) {
      db.categories.push({
        name: product.category,
        slug: product.category.toLowerCase().replace(/\s+/g, "-"),
        image: product.image,
        blurb: "Newly added category.",
      });
    }
    return product;
  });

  if (!result) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product: result });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await params;
  const removed = mutateDb((db) => {
    const index = db.products.findIndex((entry) => entry.id === id);
    if (index === -1) return false;
    db.products.splice(index, 1);
    db.outfits = db.outfits
      .map((outfit) => ({
        ...outfit,
        productIds: outfit.productIds.filter((productId) => productId !== id),
      }))
      .filter((outfit) => outfit.productIds.length > 0);
    return true;
  });

  if (!removed) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

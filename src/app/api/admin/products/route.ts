import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mutateDb } from "@/lib/db";
import { normalizeProductInput, type ProductInput } from "@/lib/product-input";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  let body: ProductInput;
  try {
    body = (await request.json()) as ProductInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const normalized = normalizeProductInput(body);
  if (!normalized.ok) return NextResponse.json({ error: normalized.error }, { status: 400 });

  const product = mutateDb((db) => {
    let slug = normalized.value.slug;
    let suffix = 2;
    while (db.products.some((entry) => entry.slug === slug)) {
      slug = `${normalized.value.slug}-${suffix}`;
      suffix += 1;
    }
    const highest = db.products.reduce((max, entry) => {
      const numeric = Number(entry.id.replace(/\D/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    const created = {
      ...normalized.value,
      slug,
      id: `p${String(highest + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
      popularity: 50,
    };
    db.products.unshift(created);
    if (!db.brands.includes(created.brand)) db.brands.push(created.brand);
    return created;
  });

  return NextResponse.json({ product }, { status: 201 });
}

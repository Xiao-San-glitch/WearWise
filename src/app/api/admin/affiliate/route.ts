import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mutateDb } from "@/lib/db";

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  let body: { updates?: { id: string; affiliateUrl?: string; sponsored?: boolean; retailer?: string }[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updates = Array.isArray(body.updates) ? body.updates : [];
  if (!updates.length) return NextResponse.json({ error: "No updates provided." }, { status: 400 });

  const invalid = updates.find(
    (update) => update.affiliateUrl !== undefined && update.affiliateUrl.trim() !== "" && !/^https?:\/\//i.test(update.affiliateUrl.trim()),
  );
  if (invalid) {
    return NextResponse.json({ error: "Affiliate URLs must start with http:// or https://." }, { status: 400 });
  }

  const count = mutateDb((db) => {
    let changed = 0;
    for (const update of updates) {
      const product = db.products.find((entry) => entry.id === update.id);
      if (!product) continue;
      if (update.affiliateUrl !== undefined && update.affiliateUrl.trim()) {
        product.affiliateUrl = update.affiliateUrl.trim();
      }
      if (update.sponsored !== undefined) product.sponsored = Boolean(update.sponsored);
      if (update.retailer !== undefined && update.retailer.trim()) {
        product.retailer = update.retailer.trim();
      }
      changed += 1;
    }
    return changed;
  });

  return NextResponse.json({ updated: count });
}

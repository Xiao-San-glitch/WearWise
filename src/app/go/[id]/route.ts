import { NextResponse } from "next/server";
import { getProductById, mutateDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { randomId } from "@/lib/crypto";

/**
 * Affiliate outbound redirect. Records the click, then sends the shopper to the
 * retailer. No order is created on WearWise — the purchase happens on the
 * partner site.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) {
    return NextResponse.redirect(new URL("/shop", request.url));
  }

  const user = await getSessionUser();
  const url = new URL(request.url);
  const source = url.searchParams.get("source") ?? "product";

  mutateDb((db) => {
    db.clicks.unshift({
      id: randomId("clk"),
      productId: product.id,
      productName: product.name,
      userEmail: user?.email ?? null,
      source,
      createdAt: new Date().toISOString(),
    });
    if (db.clicks.length > 2000) db.clicks.length = 2000;
    const stored = db.products.find((entry) => entry.id === product.id);
    if (stored) stored.popularity = Math.min(100, stored.popularity + 0.2);
  });

  return NextResponse.redirect(product.affiliateUrl, { status: 307 });
}

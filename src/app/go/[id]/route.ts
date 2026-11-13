import { NextResponse } from "next/server";
import { getProductById, mutateDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { randomId } from "@/lib/crypto";

/**
 * Affiliate outbound redirect. Tracking is best-effort: on serverless hosts
 * such as Vercel, the local filesystem may be read-only. A tracking write
 * must never prevent the shopper from reaching the retailer.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return NextResponse.redirect(new URL("/shop", request.url), { status: 302 });
  }

  let destination: URL;
  try {
    destination = new URL(product.affiliateUrl);
    if (destination.protocol !== "https:" && destination.protocol !== "http:") {
      throw new Error("Unsupported retailer URL protocol");
    }
  } catch {
    return NextResponse.redirect(new URL("/shop", request.url), { status: 302 });
  }

  // Add tracking parameters only when absent. Existing affiliate parameters
  // and retailer-specific query strings are preserved.
  if (!destination.searchParams.has("utm_source")) {
    destination.searchParams.set("utm_source", "wearwise");
  }
  if (!destination.searchParams.has("utm_medium")) {
    destination.searchParams.set("utm_medium", "affiliate");
  }

  // Analytics persistence is optional for the outbound shopping journey.
  try {
    const user = await getSessionUser();
    const source = new URL(request.url).searchParams.get("source") ?? "product";
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
  } catch (error) {
    console.error("WearWise affiliate click tracking failed; continuing redirect.", error);
  }

  return NextResponse.redirect(destination, { status: 302 });
}

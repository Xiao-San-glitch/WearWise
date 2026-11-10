import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/db";
import { filterProducts } from "@/lib/search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ products: [] });

  const matches = filterProducts(getProducts(), { q: query }).slice(0, 6);
  return NextResponse.json({
    products: matches.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
    })),
  });
}

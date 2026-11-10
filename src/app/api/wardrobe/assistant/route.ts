import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProducts, getWardrobeForUser } from "@/lib/db";
import { answerWardrobeAssistant } from "@/lib/wardrobe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to talk to your wardrobe stylist." }, { status: 401 });

  let body: { message?: string };
  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "Please type a question." }, { status: 400 });
  if (message.length > 600) {
    return NextResponse.json({ error: "Keep questions under 600 characters." }, { status: 400 });
  }

  const wardrobe = getWardrobeForUser(user.id);
  const products = getProducts();
  const reply = answerWardrobeAssistant(message, wardrobe, products);
  const productMap = new Map(products.map((product) => [product.id, product]));
  const productSummaries = reply.productIds
    .map((id) => productMap.get(id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.image,
      price: product.price,
      category: product.category,
    }));

  return NextResponse.json({
    ...reply,
    products: productSummaries,
    wardrobeCount: wardrobe.length,
  });
}

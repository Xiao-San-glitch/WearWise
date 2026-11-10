import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProducts, getWardrobeForUser } from "@/lib/db";
import { buildBudgetPlan, findMissingItems, wardrobeStats } from "@/lib/wardrobe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to analyse your closet." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mode = String(body.mode ?? "missing");
  const wardrobe = getWardrobeForUser(user.id);
  const products = getProducts();
  const stats = wardrobeStats(wardrobe);

  if (mode === "budget") {
    const budget = Math.round(Number(body.budget));
    if (!Number.isFinite(budget) || budget < 100 || budget > 200000) {
      return NextResponse.json({ error: "Enter a budget between ₹100 and ₹2,00,000." }, { status: 400 });
    }
    const plan = buildBudgetPlan(wardrobe, products, budget);
    return NextResponse.json({ plan, stats });
  }

  if (!wardrobe.length) {
    return NextResponse.json({
      recommendations: [],
      stats,
      message: "Add a few wardrobe pieces first — recommendations are based on what you already own.",
    });
  }

  const limit = Math.min(Math.max(Number(body.limit) || 6, 1), 9);
  const recommendations = findMissingItems(wardrobe, products, limit);
  return NextResponse.json({ recommendations, stats });
}

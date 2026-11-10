import { NextResponse } from "next/server";
import { addHistory, getProducts } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { generateStylistWithGemini, isGeminiConfigured } from "@/lib/gemini";
import { buildOutfits, parseBudget, summarize, validateOutfits } from "@/lib/recommend";
import { SEASONS, STYLES, OCCASIONS, COLORS } from "@/lib/seed";
import type { Audience, Fit, OutfitRecommendation, StylistPreferences, StylistResponse } from "@/lib/types";

interface Body {
  audience?: string;
  budget?: string;
  customBudget?: number;
  occasion?: string;
  style?: string;
  colors?: string[];
  season?: string;
  categories?: string[];
  fit?: string;
  instructions?: string;
  refinement?: string;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const audience: Audience = ["men", "women", "unisex"].includes(body.audience ?? "")
    ? (body.audience as Audience)
    : "unisex";
  const budget = parseBudget({ budget: body.budget, customBudget: body.customBudget });
  if (budget.max < 300) {
    return NextResponse.json(
      { error: "Please set a budget of at least ₹300 so we can build a look." },
      { status: 400 },
    );
  }

  const prefs: StylistPreferences = {
    audience,
    budget: budget.max,
    budgetLabel: budget.label,
    occasion: OCCASIONS.includes(body.occasion ?? "") ? body.occasion! : "Casual",
    style: STYLES.includes(body.style ?? "") ? body.style! : "Minimalist",
    colors: (body.colors ?? []).filter((color) => COLORS.includes(color)).slice(0, 4),
    season: SEASONS.includes(body.season ?? "") ? body.season! : "All-season",
    categories: Array.isArray(body.categories) ? body.categories.slice(0, 6) : [],
    fit: ["slim", "regular", "oversized"].includes(body.fit ?? "") ? (body.fit as Fit) : "",
    instructions: [body.instructions, body.refinement].filter(Boolean).join(" ").slice(0, 400),
  };

  const products = getProducts();
  const user = await getSessionUser();

  let outfits: OutfitRecommendation[] = [];
  let source: "gemini" | "fallback" = "fallback";
  let summary = "";

  if (isGeminiConfigured()) {
    try {
      const ai = await generateStylistWithGemini(prefs, products);
      if (ai) {
        const validated = validateOutfits(ai.outfits, prefs, products);
        if (validated.length > 0) {
          outfits = validated;
          source = "gemini";
          summary =
            typeof ai.summary === "string" && ai.summary.trim()
              ? ai.summary.trim().slice(0, 300)
              : summarize(prefs, validated);
        }
      }
    } catch {
      /* fall through to the local engine */
    }
  }

  if (!outfits.length) {
    outfits = buildOutfits(prefs, products);
    source = "fallback";
    summary = summarize(prefs, outfits);
  }

  const total = outfits[0]?.total ?? 0;

  if (user) {
    addHistory({
      userId: user.id,
      kind: "stylist",
      prompt: `${prefs.style} · ${prefs.occasion} · ₹${prefs.budget} · ${prefs.audience}`,
      source,
    });
  }

  const response: StylistResponse & { preferences: StylistPreferences; configured: boolean } = {
    outfits,
    source,
    summary,
    budget: prefs.budget,
    remaining: Math.max(0, prefs.budget - total),
    preferences: prefs,
    configured: isGeminiConfigured(),
  };

  return NextResponse.json(response);
}
